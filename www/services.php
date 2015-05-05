<?php

require_once("../bin/config.php");
require_once("../vendor/autoload.php");

date_default_timezone_set($cfg['timezone']);

$mongo = new Mongo($cfg['mongoHost']);

session_start();
$sessid = session_id();

function getTime() {
    return date("Y-m-d H:i:s") . microtime();
}

function toHtmlId($mongoId) {
    return "wt" . $mongoId;
}

function toMongoId($htmlId) {
    return ltrim($htmlId, "wt");
}

function isValid($secret, $realSecret) {
    return $secret === $realSecret;
}

function response($arr, $status="ok") {
    $arr['status'] = $status;
    print(json_encode($arr));
}

function parseForAt($due) {
    return date("H:i n/j/Y", strtotime(trim($due)));
}

function remind($due, $text, $cfg) {
    if ($cfg['enable-due']) {
        $due = parseForAt($due);
        $message = preg_replace("/\"/", "\\\"", trim($text));
        $message = preg_replace("/\r|\n/", "", $message);
        $messageTruncated = strlen($message) > $cfg['due-truncate-subject-at'] 
            ? substr($message, 0, $cfg['due-truncate-subject-at']) . "..." : $message;
        $rand = sha1(microtime() . date("U") . time() . $due);
        if (!file_exists("../jobs")) {
            mkdir("../jobs");
        }
        foreach ($cfg['due-to'] as $email) {
            file_put_contents("../jobs/{$rand}", "echo \"{$message}\" | "
                . "mail -a \"From: {$cfg['due-from']}\" -s "
                . "\"{$cfg['due-subject-prefix']} {$messageTruncated}\" {$email}\n", FILE_APPEND);
        }
        $cmd = "sudo at {$due} -f ../jobs/{$rand}";
        exec($cmd);
    }
}

$app = new \Slim\Slim();

$app->response()->header("Content-Type", "application/json");

$app->get('/services/load-all/:secret', function ($secret) use ($cfg, $mongo) {
    if (isValid($secret, $cfg['secret'])) {
        $items = $mongo->{$cfg['mongoDatabase']}->items;
        $lists = $items->distinct("list");
        sort($lists, SORT_NATURAL);

        response(array("msg"=>"All items returned successfully.", "items"=>$lists));
    }
});

$app->get('/services/load/:list/:secret', function ($list, $secret) use ($cfg, $mongo) {
    if (isValid($secret, $cfg['secret'])) {
        $items = $mongo->{$cfg['mongoDatabase']}->items;
        $data = array("list"=>$list, "deleted"=>false);
        //$mr = $items->find($data)->sort(array("strike" => 1, "priority" => 1, "timestamp" => 1));
        $mr = $items->find($data)->sort(array("strike" => 1, "priority" => -1));
        $items = array();
        while ($mr->hasNext()) {
            $item = $mr->getNext();
            $items[] = array("id"=>toHtmlId($item['_id']->{'$id'}), "text"=>$item['text'], 
                "strike"=>$item['strike'], "labels"=>$item['labels'], "priority"=>$item['priority'], 
                "due"=>$item['due']);
        }

        response(array("msg"=>"All items returned successfully.", "items"=>$items));
    }
});

$app->post('/services/save/:list/:id/:done/:secret', function ($list, $id, $done, $secret) use ($cfg, $mongo, $app) {
    if (isValid($secret, $cfg['secret'])) {
        $text = $app->request()->post("text");

        // start: process text
        // Get reminder using strtotime() syntax (e.g. @<Friday 5pm>)
        preg_match("/([^\\\])?(@<\s*)(.*?)(\s*>)/", $text, $m);
        $due = isset($m[3]) ? $m[3] : "";
        $text = count($m) > 0 ? str_replace($m[0], $m[1] . (parseForAt($due)), $text) : $text;
        $done = $done === true || $done === "true" ? true : false;
        if ($done) {
            remind($due, $text, $cfg);
        }

        // Get label (e.g. #label)
        preg_match_all("/[^\\\]?#([a-zA-Z0-9-_]+)/", $text, $m);
        $labels = count($m) > 0 ? $m[1] : array();

        // Get priority (e.g. !10)
        preg_match("/[^\\\]?!([0-9]+)/", $text, $m);
        $priority = count($m) > 0 ? $m[1] : 0;
        // end: process text

        $items = $mongo->{$cfg['mongoDatabase']}->items;
        $data = array("text"=>$text, "list"=>$list, "labels"=>$labels,
                "priority"=>$priority, "due"=>$due, "timestamp"=>getTime());
        if ($id === null || $id === "null") {
            // This handles a new item.
            $data['strike'] = false;
            $data['deleted'] = false;
            $items->insert($data);
            $id = toHtmlId($data['_id']->{'$id'});
        } else {
            // This handles an update.
            $mongoId = new MongoID(toMongoId($id));
            $items->update(array("_id"=>$mongoId), array('$set'=>$data));
        }

        response(array("msg"=>"Saved item.", "id"=>$id, "labels"=>$labels, "priority"=>$priority));
    }
});

$app->get('/services/delete/:id/:secret', function ($id, $secret) use ($cfg, $mongo) {
    if (isValid($secret, $cfg['secret'])) {
        $items = $mongo->{$cfg['mongoDatabase']}->items;
        $mongoId = new MongoID(toMongoId($id));
        // Uncomment this if you want to remove the item completely.
        //$items->remove(array("_id"=>$mongoId));
        $items->update(array("_id"=>$mongoId), array('$set' => array("deleted"=>true)));

        response(array("msg"=>"Deleted item."));
    }
});

$app->get('/services/strike/:id/:strike/:secret', function ($id, $strike, $secret) use ($cfg, $mongo) {
    if (isValid($secret, $cfg['secret'])) {
        $items = $mongo->{$cfg['mongoDatabase']}->items;
        $strike = $strike === true || $strike === "true" ? true : false;
        $mongoId = new MongoID(toMongoId($id));
        $items->update(array("_id"=>$mongoId), array('$set' => array("strike"=>$strike)));

        $items = $mongo->{$cfg['mongoDatabase']}->items;

        response(array("msg"=>"Striked item."));
    }
});

$app->get('/services/clear-poll-queue/:list/:secret', function ($list, $secret) use ($cfg, $mongo) {
    if (isValid($secret, $cfg['secret'])) {
        $pollQueue = $mongo->{$cfg['mongoDatabase']}->queue;
        $pollQueue->remove(array("sessid"=>$sessid, "list"=>$list));

        response(array("msg"=>"Poll queue cleared."));
    }
});

$app->run();
