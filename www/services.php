<?php

require_once("../bin/config.php");
require_once("../lib/white.php");
require_once("../vendor/autoload.php");

date_default_timezone_set($cfg['timezone']);

$mongo = new Mongo($cfg['mongoHost']);
$w = new White($mongo, $cfg);

session_start();
$sessid = session_id();

function response($arr) {
    print(json_encode($arr));
}

function responseByStatus($arr, $status, $app) {
    $app->response->setStatus($status);
    response($arr);
}

$app = new \Slim\Slim();

$app->response()->header("Content-Type", "application/json");

$app->get('/services/load-all/:secret', function ($secret) use ($cfg, $mongo, $w, $app) {
    if ($w->isValid($secret, $cfg['secret'])) {
        response(array("msg"=>"All items returned successfully.", "items"=>$w->getAllLists()));
    } else {
        responseByStatus(array("msg"=>"Please authenticate first."), 403, $app);
    }
});

$app->get('/services/load/:list/:secret', function ($list, $secret) use ($cfg, $mongo, $w, $app) {
    if ($w->isValid($secret, $cfg['secret'])) {
        $items = $mongo->{$cfg['mongoDatabase']}->items;
        $data = array("list"=>$list, "deleted"=>false);
        //$mr = $items->find($data)->sort(array("strike" => 1, "priority" => 1, "timestamp" => 1));
        $mr = $items->find($data)->sort(array("strike" => 1, "priority" => -1));
        $items = array();
        while ($mr->hasNext()) {
            $item = $mr->getNext();
            $items[] = array("id"=>$w->toHtmlId($item['_id']->{'$id'}), "text"=>$item['text'], 
                "strike"=>$item['strike'], "labels"=>$item['labels'], "priority"=>$item['priority'], 
                "due"=>$item['due']);
        }
        response(array("msg"=>"All items returned successfully.", "items"=>$items));
    } else {
        responseByStatus(array("msg"=>"Please authenticate first."), 403, $app);
    }
});

$app->post('/services/save/:list/:id/:done/:secret', function ($list, $id, $done, $secret) use ($cfg, $mongo, $app, $w) {
    if ($w->isValid($secret, $cfg['secret'])) {
        $text = $app->request()->post("text");

        // start: process text
        // Get reminder using strtotime() syntax (e.g. @<Friday 5pm> or @(Friday 5pm))
        preg_match("/([^\\\])?(@[<\(]\s*)(.*?)(\s*[>\)])/", $text, $m);
        $due = isset($m[3]) ? $m[3] : "";
        $text = count($m) > 0 ? str_replace($m[0], $m[1] . ($w->parseForAt($due)), $text) : $text;
        $done = $done === true || $done === "true" ? true : false;
        if ($done) {
            $w->remind($due, $text);
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
                "priority"=>$priority, "due"=>$due, "timestamp"=>$w->getTime());
        if ($id === null || $id === "null") {
            // This handles a new item.
            $data['strike'] = false;
            $data['deleted'] = false;
            $items->insert($data);
            $id = $w->toHtmlId($data['_id']->{'$id'});
        } else {
            // This handles an update.
            $mongoId = new MongoID($w->toMongoId($id));
            $items->update(array("_id"=>$mongoId), array('$set'=>$data));
        }
        response(array("msg"=>"Saved item.", "id"=>$id, "labels"=>$labels, "priority"=>$priority));
    } else {
        responseByStatus(array("msg"=>"Please authenticate first."), 403, $app);
    }
});

$app->get('/services/delete/:id/:secret', function ($id, $secret) use ($cfg, $mongo, $w, $app) {
    if ($w->isValid($secret, $cfg['secret'])) {
        $items = $mongo->{$cfg['mongoDatabase']}->items;
        $mongoId = new MongoID($w->toMongoId($id));
        // Uncomment this if you want to remove the item completely.
        //$items->remove(array("_id"=>$mongoId));
        $items->update(array("_id"=>$mongoId), array('$set' => array("deleted"=>true)));
        response(array("msg"=>"Deleted item."));
    } else {
        responseByStatus(array("msg"=>"Please authenticate first."), 403, $app);
    }
});

$app->get('/services/strike/:id/:strike/:secret', function ($id, $strike, $secret) use ($cfg, $mongo, $w, $app) {
    if ($w->isValid($secret, $cfg['secret'])) {
        $items = $mongo->{$cfg['mongoDatabase']}->items;
        $strike = $strike === true || $strike === "true" ? true : false;
        $mongoId = new MongoID($w->toMongoId($id));
        $items->update(array("_id"=>$mongoId), array('$set' => array("strike"=>$strike)));

        $items = $mongo->{$cfg['mongoDatabase']}->items;
        response(array("msg"=>"Striked item."));
    } else {
        responseByStatus(array("msg"=>"Please authenticate first."), 403, $app);
    }
});

$app->get('/services/clear-poll-queue/:list/:secret', function ($list, $secret) use ($cfg, $mongo, $w, $app) {
    if ($w->isValid($secret, $cfg['secret'])) {
        $pollQueue = $mongo->{$cfg['mongoDatabase']}->queue;
        $pollQueue->remove(array("sessid"=>$sessid, "list"=>$list));
        response(array("msg"=>"Poll queue cleared."));
    } else {
        responseByStatus(array("msg"=>"Please authenticate first."), 403, $app);
    }
});

$app->run();
