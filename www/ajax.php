<?php

require_once("../bin/config.php");

$cfg['mongoDatabase'] = "white";
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

if ($_GET['a'] === "load") {

    $items = $mongo->{$cfg['mongoDatabase']}->items;
    $data = array("list"=>$_GET['list']);
    $mr = $items->find($data)->sort(array("timestamp" => -1));
    $items = array();
    while ($mr->hasNext()) {
        $item = $mr->getNext();
        $items[] = array("id"=>toHtmlId($item['_id']->{'$id'}), 
                "text"=>$item['text'], "strike"=>$item['strike']);
    }

    print(json_encode(array("status"=>"ok", 
            "msg"=>"All items returned successfully.", "items"=>$items)));
    die();

} else if ($_GET['a'] === "save") {

    $id = $_GET['id'];
    $text = $_GET['text'];
    $items = $mongo->{$cfg['mongoDatabase']}->items;
    $item = array("text"=>$_GET['text']);
    if ($id === null || $id === "null") {
        $data = array("text"=>$_GET['text'], "strike"=>false, 
                "list"=>$_GET['list'], "timestamp"=>getTime());
        $items->insert($data);
        $id = toHtmlId($data['_id']->{'$id'});
    } else {
        $mongoId = new MongoID(toMongoId($id));
        $items->update(array("_id"=>$mongoId), array('$set'=>array("text"=>$_GET['text'])));
    }

    print(json_encode(array("status"=>"ok", "msg"=>"Saved item.", "id"=>$id)));
    die();

} else if ($_GET['a'] === "delete") {

    $id = $_GET['id'];
    $items = $mongo->{$cfg['mongoDatabase']}->items;
    $mongoId = new MongoID(toMongoId($id));
    $items->remove(array("_id"=>$mongoId));

    print(json_encode(array("status"=>"ok", "msg"=>"Deleted item.")));
    die();

} else if ($_GET['a'] === "strike") {

    $id = $_GET['id'];
    $items = $mongo->{$cfg['mongoDatabase']}->items;
    $strike = $_GET['strike'] === true || $_GET['strike'] === "true" ? true : false;
    $strikejson = $_GET['strike'] === true || $_GET['strike'] === "true" ? "true" : "false";
    $mongoId = new MongoID(toMongoId($id));
    $items->update(array("_id"=>$mongoId), array('$set' => array("strike"=>$strike)));

    $items = $mongo->{$cfg['mongoDatabase']}->items;

    print(json_encode(array("status"=>"ok", "msg"=>"Striked item.")));
    die();

} else if ($_GET['a'] === "clear-poll-queue") {

    $pollQueue = $mongo->{$cfg['mongoDatabase']}->queue;
    $pollQueue->remove(array("sessid"=>$sessid, "list"=>$_GET['list']));

    print(json_encode(array("status"=>"ok", "msg"=>"Poll queue cleared.")));
    die();

}
