import { DtlsParameters, DtlsState, MediaKind, Router, RtpCapabilities, RtpParameters, WebRtcTransport, Worker } from 'mediasoup/lib/types';
import { Server } from 'socket.io';

import mediasoupConfig from './mediasoupConfig';
import Peer from './Peer';

export default class Room {
    id: string;
    router: Router;
    peers: Map<string, Peer>;
    io: Server;

    static async createRoom(roomId: string, worker: Worker, io: Server): Promise<Room> {
      const mediaCodecs = mediasoupConfig.router.mediaCodecs;
      const router = await worker.createRouter({
        mediaCodecs,
      });
      const createdRoom = new Room(roomId, router, io);
      
      return createdRoom;
      // .then((router: Router) => {
      //   this.router = router;
      // }).catch((err) => {
      //   console.error('failed to create router for room!!');
      //   console.error(err);
      // });
    }

    constructor(roomId: string, router: Router, io: Server) {
      this.router = router;
      this.id = roomId;
      this.peers = new Map();
      this.io = io;
    }

    addPeer(peer: Peer): void {
      this.peers.set(peer.socket.id, peer);
      // peer.setRoom(this);
      // peer.socket.join(this.id);
    }

    async removePeer(peer: Peer): Promise<void>{
      const id = peer.socket.id;

      const wasRemoved = this.peers.delete(id);
      if(!wasRemoved){
        return Promise.reject('Couldn\'t remove the peer. No such peer existed in the room');
      }

      return;
      // return this.removePeerBySocketId(id);
      // const removePeer = this.peers.get(id);
      // if(removePeer){
      //   // removePeer.close(); // TODO: Should we really close the Peer just because it leaves a room???
      //   // removePeer.socket.leave(this.id);
        
      //   this.peers.delete(socketId);
      // }
    }

    async removePeerBySocketId(socketId: string): Promise<void> {
      const peer = this.peers.get(socketId);
      if(peer){

        peer.close(); // TODO: Should we really close the peer just because it leaves a room???
        peer.socket.leave(this.id);
        
        this.peers.delete(socketId);
      }
    }

    getProducerListForPeer(socketId: string): Array<Record<string, string>> {
      const producerList: Array<Record<string, string>> = [];
      const peer = this.peers.get(socketId);
      if(peer){
        peer.producers.forEach(producer => {
          producerList.push({
            producer_id: producer.id,
          });
        });
      }else{
        console.error(`no peer with id ${socketId} found when trying to get producers`);
      }
      if(producerList.length == 0){
        console.error('no producers found!');
      }
      return producerList;
    }

    getRtpCapabilities(): RtpCapabilities {
      return this.router.rtpCapabilities;
    }

    async createWebRtcTransport(): Promise<WebRtcTransport> {
      // const {
      //   initialAvailableOutgoingBitrate,
      // } = mediasoupConfig.webRtcTransport;

      const transport = await this.router.createWebRtcTransport({
        listenIps: mediasoupConfig.webRtcTransport.listenIps,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: mediasoupConfig.webRtcTransport.initialAvailableOutgoingBitrate,

      });
      if (mediasoupConfig.maxIncomingBitrate) {
        try {
          await transport.setMaxIncomingBitrate(mediasoupConfig.maxIncomingBitrate);
        } catch (error) {
          console.error('failed to set maximum incoming bitrate');
        }
      }

      transport.on('dtlsstatechange', (dtlsState: DtlsState) => {

        if (dtlsState === 'closed') {
          console.log('---transport close--- transport with id ' + transport.id + ' closed');
          transport.close();
        }
      });

      transport.on('close', () => {
        console.log('---transport close--- transport with id ' + transport.id + ' closed');
      });
      console.log('---adding transport---', transport.id);
      // this.peers.get(socketId)?.addTransport(transport);
      // return {
      //   params: {
      //     id: transport.id,
      //     iceParameters: transport.iceParameters,
      //     iceCandidates: transport.iceCandidates,
      //     dtlsParameters: transport.dtlsParameters,
      //   },
      // const iceCandidates = transport.iceCandidates as mediasoupClientTypes.IceCandidate[];
      // const transportOptions: mediasoupClientTypes.TransportOptions = {
      //   id: transport.id,
      //   dtlsParameters: transport.dtlsParameters,
      //   iceParameters: transport.iceParameters,
      //   iceCandidates: iceCandidates,
      // };
      return transport;
    }

    async connectPeerTransport(socketId: string, transportId: string, dtlsParameters: DtlsParameters): Promise<void> {
      if (!this.peers.has(socketId)) return;
      await this.peers.get(socketId)?.connectTransport(transportId, dtlsParameters);

    }

    async produce(socketId: string, producerTransportId: string, rtpParameters: RtpParameters, kind: MediaKind): Promise<string> {
      const producer = await this.peers.get(socketId)?.createProducer(rtpParameters, kind);
      if(producer){   
        // this.broadCast(socketId, 'newProducers', [{
        //   producerId: producer.id,
        //   producerSocketId: socketId,
        // }]);
        return producer.id;
      }
      throw 'failed when trying to create producer';
    }

    // async consume(socketId: string, consumerTransportId: string, producerId: string,  rtpCapabilities: RtpCapabilities): Promise<any> {
    //   // handle nulls
    //   if (!this.router.canConsume({
    //     producerId: producerId,
    //     rtpCapabilities,
    //   })) {
    //     console.error('can not consume');
    //     return;
    //   }

    //   const peer = this.peers.get(socketId);

    //   if(!peer){
    //     throw `no peer with that id: ${socketId}`;
    //   }
    //   const {consumer, params} = await peer.createConsumer(consumerTransportId, producerId, rtpCapabilities);
        
    //   consumer.on('producerclose', () => {
    //     console.log(`---consumer closed--- due to producerclose event  name:${this.peers.get(socketId)?.name} consumer_id: ${consumer.id}`);
    //     this.peers.get(socketId)?.removeConsumer(consumer.id);
    //     // tell client consumer is dead
    //     this.io.to(socketId).emit('consumerClosed', {
    //       consumer_id: consumer.id,
    //     });
    //   });

    //   return params;

    // }


    closeProducer(socketId: string, producer_id: string): void {
      this.peers.get(socketId)?.closeProducer(producer_id);
    }

    // broadCast(socketId: string, name: string, data: { producerId: string; producerSocketId: string; }[]): void {
    //   for (const otherID of Array.from(this.peers.keys()).filter(id => id !== socketId)) {
    //     this.send(otherID, name, data);
    //   }
    // }

    // send(socketId: string | string[], name: string, data: unknown): void {
    //   this.io.to(socketId).emit(name, data);
    // }

    getPeers(): Map<string, Peer> {
      return this.peers;
    }



  // toJson(): Record<string, string> {
  //   return {
  //     id: this.id,
  //     peers: JSON.stringify(this.peers),
  //   };
  // }
}