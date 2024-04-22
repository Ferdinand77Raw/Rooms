<?php

namespace Chats;

use Ratchet\ConnectionInterface;
use Ratchet\MessageComponentInterface;

class Chat implements MessageComponentInterface
{

    protected $clients;

    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
        $this->channel = [];
        $this->direct = [];
        $this->private = [];
        echo "Server started \n";
    }

    public function onOpen(ConnectionInterface $conn)
    {
        // Store the new connection to send messages to later
        $this->clients->attach($conn);

        echo "New connection! ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        $numRecv = count($this->clients) - 1;
        echo sprintf(
            'Connection %d sending message "%s" to %d other connection%s' . "\n",
            $from->resourceId,
            $msg,
            $numRecv,
            $numRecv == 1 ? '' : 's'
        );
        $data = json_decode($msg, true);

        if($data['operacion'] == "setChannel"){
          foreach ($data['channel'] as $roomid) {
            if (!isset($this->channel[$roomid])) {
              $this->channel[$roomid] = new \SplObjectStorage;
            }
            $this->channel[$roomid]->attach($from);
          }
          foreach ($data['direct'] as $roomid) {
            if (!isset($this->direct[$roomid])) {
              $this->direct[$roomid] = new \SplObjectStorage;
            }
            $this->direct[$roomid]->attach($from);
          }
          foreach ($data['private'] as $roomid) {
            if (!isset($this->private[$roomid])) {
              $this->private[$roomid] = new \SplObjectStorage;
            }
            $this->private[$roomid]->attach($from);
          }
          return;
        }
        $data['time'] = date('Y-m-d H:i:s');

        $room_type = $data["room_type"];
        $room_id = $data["room_id"];
        
        /**One to One chat**/
        if ($room_type == 'Direct Message') {
            foreach ($this->direct[$room_id] as $client) {
                /**Logic to send and see the message in both chats**/
                if ($from == $client) {
                    $data['from'] = $from;
                } else {
                    $data['from'] = $client;
                }
                $client->send(json_encode($data));
            }
        }
        /**Group Chat**/
        else if ($room_type == 'Private Group') {
            foreach ($this->private[$room_id] as $client) {
                if ($from == $client) {
                    $data['from'] = $from;
                } else {
                    $data['from'] = $client;
                }

                $client->send(json_encode($data));
            }
        }
        /**Group Channel*/
        else if ($room_type == 'Channel') {
            foreach ($this->channel[$room_id] as $client) {
                if ($from == $client) {
                    $data['from'] = $from;
                } else {
                    $data['from'] = $client;
                }

                $client->send(json_encode($data));
            }
        }
    }

    public function onClose(ConnectionInterface $conn)
    {
      foreach ($this->channels as $channel) {
        if ($conn == $connCli) {
          $this->clients->detach($conn);
        }
      }
        // The connection is closed, remove it, as we can no longer send it messages
        $this->clients->detach($conn);

        echo "Connection {$conn->resourceId} has disconnected\n";

        //print_r($conn . " is no loger active.");
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "An error has occurred: {$e->getMessage()}\n";

        $conn->close();
    }
}
