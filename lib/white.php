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

}
