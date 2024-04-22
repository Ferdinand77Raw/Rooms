<?php

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use Chats\Chat;

chdir(dirname(__FILE__) . "/../../../");

require 'modules/Rooms/websockets/vendor/autoload.php';
require 'config.inc.php';
require 'src/Chats.php';

global $roomsocket;
global $dbconfig;

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new Chat()
        )
    ),
    $roomsocket
);

$server->run();