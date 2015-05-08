<?php

class White {

    private $mongo;
    private $cfg;

    public function __construct($mongo, $cfg) {
        $this->mongo = $mongo;
        $this->cfg = $cfg;
    }

    public function getTime() {
        return date("Y-m-d H:i:s") . microtime();
    }

    public function toHtmlId($mongoId) {
        return "wt" . $mongoId;
    }

    public function toMongoId($htmlId) {
        return ltrim($htmlId, "wt");
    }

    public function isValid($secret, $realSecret) {
        return $secret === $realSecret;
    }

    public function parseForAt($due) {
        return date("H:i n/j/Y", strtotime(trim($due)));
    }

    public function remind($due, $text) {
        if ($this->cfg['enable-due']) {
            $due = $this->parseForAt($due);
            $message = preg_replace("/\"/", "\\\"", trim($text));
            $message = preg_replace("/\r|\n/", "", $message);
            $messageTruncated = strlen($message) > $this->cfg['due-truncate-subject-at'] 
                ? substr($message, 0, $this->cfg['due-truncate-subject-at']) . "..." : $message;
            $rand = sha1(microtime() . date("U") . time() . $due);
            if (!file_exists("../jobs")) {
                mkdir("../jobs");
            }
            foreach ($this->cfg['due-to'] as $email) {
                file_put_contents("../jobs/{$rand}", "echo \"{$message}\" | "
                    . "mail -a \"From: {$this->cfg['due-from']}\" -s "
                    . "\"{$this->cfg['due-subject-prefix']} {$messageTruncated}\" {$email}\n", FILE_APPEND);
            }
            $cmd = "sudo at {$due} -f ../jobs/{$rand}";
            exec($cmd);
        }
    }

    public function getAllLists() {
        $items = $this->mongo->{$this->cfg['mongoDatabase']}->items;
        $lists = $items->distinct("list");
        sort($lists, SORT_NATURAL);
        return $lists;
    }

    public function getList($list) {
        $items = $this->mongo->{$this->cfg['mongoDatabase']}->items;
        $data = array("list"=>$list, "deleted"=>false);
        //$mr = $items->find($data)->sort(array("strike" => 1, "priority" => 1, "timestamp" => 1));
        $mr = $items->find($data)->sort(array("strike" => 1, "priority" => -1));
        $items = array();
        while ($mr->hasNext()) {
            $item = $mr->getNext();
            $items[] = array("id"=>$this->toHtmlId($item['_id']->{'$id'}), "text"=>$item['text'], 
                "strike"=>$item['strike'], "labels"=>$item['labels'], "priority"=>$item['priority'], 
                "due"=>$item['due']);
        }
        return $items;
    }

    public function saveList($list, $id, $done, $text) {
        // start: process text
        // Get reminder using strtotime() syntax (e.g. @<Friday 5pm> or @(Friday 5pm))
        preg_match("/([^\\\])?(@[<\(]\s*)(.*?)(\s*[>\)])/", $text, $m);
        $due = isset($m[3]) ? $m[3] : "";
        $text = count($m) > 0 ? str_replace($m[0], $m[1] . ($this->parseForAt($due)), $text) : $text;
        $done = $done === true || $done === "true" ? true : false;
        if ($done) {
            $this->remind($due, $text);
        }

        // Get label (e.g. #label)
        preg_match_all("/[^\\\]?#([a-zA-Z0-9-_]+)/", $text, $m);
        $labels = count($m) > 0 ? $m[1] : array();

        // Get priority (e.g. !10)
        preg_match("/[^\\\]?!([0-9]+)/", $text, $m);
        $priority = count($m) > 0 ? $m[1] : 0;
        // end: process text

        $items = $this->mongo->{$this->cfg['mongoDatabase']}->items;
        $data = array("text"=>$text, "list"=>$list, "labels"=>$labels,
                "priority"=>$priority, "due"=>$due, "timestamp"=>$this->getTime());
        if ($id === null || $id === "null") {
            // This handles a new item.
            $data['strike'] = false;
            $data['deleted'] = false;
            $items->insert($data);
            $id = $this->toHtmlId($data['_id']->{'$id'});
        } else {
            // This handles an update.
            $mongoId = new MongoID($this->toMongoId($id));
            $items->update(array("_id"=>$mongoId), array('$set'=>$data));
        }
        return array("labels" => $labels, "priority" => $priority);
    }

}
