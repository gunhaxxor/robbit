import { Consumer, DtlsParameters, MediaKind, Producer, RtpParameters, WebRtcTransport } from 'mediasoup/lib/types';
import {types as mediasoupClientTypes } from 'mediasoup-client';
import { SocketExt } from 'socket.io';
import Room from './Room';
// import { MediasoupConfig } from './mediasoupConfig';
export default class Peer {
  // socketId: string;
  socket: SocketExt;
  name: string;
  // transports: Map<string, WebRtcTransport>;
  rtpCapabilities?: mediasoupClientTypes.RtpCapabilities;
  receiveTransport?: WebRtcTransport; // In the perspective of the client
  sendTransport?: WebRtcTransport; // In the perspective of the client
  consumers: Map<string, Consumer>;
  producers: Map<string, Producer>;
  room?: Room;


  constructor(socket: SocketExt, name = '') {
    this.socket = socket;
    // this.socketId = socket.id;
    this.name = name;
    // this.transports = new Map();
    this.consumers = new Map();
    this.producers = new Map();
  }

  setRtpCapabilities (rtpCapabilities: mediasoupClientTypes.RtpCapabilities): void {
    this.rtpCapabilities = rtpCapabilities;
  }

  async joinRoom(room: Room): Promise<void>{
    if(room){
      room.addPeer(this);
      // this.setRoom(room);
      this.room = room;
      this.socket.join(room.id);
      return;
    }
    return Promise.reject('failed to join room');
  }
  async leaveRoom(room: Room): Promise<void> {
    if(room) {
      room.removePeer(this);
      // this.setRoom(undefined);
      this.room = undefined;
      this.socket.leave(room.id);
    }
  }

  // setRoom(room: Room): void{
  //   this.room = room;
  // }

  // addTransport(transport: WebRtcTransport): void {
  //   this.transports.set(transport.id, transport);
  // }


  async createWebRtcTransport(receiver: boolean): Promise<mediasoupClientTypes.TransportOptions> {
    // const {
    //   initialAvailableOutgoingBitrate,
    // } = mediasoupConfig.webRtcTransport;

    if(!this.room){
      return Promise.reject('Must be attached to a room in order to create webRtcTransport');
    }
    const transport = await this.room.createWebRtcTransport();
    if(receiver){
      this.receiveTransport = transport;
      // this.receiveTransport = await this.room.createWebRtcTransport();
      // return this.receiveTransport;
    } else {
      this.sendTransport = transport;
      // this.sendTransport = await this.room.createWebRtcTransport();
      // return this.sendTransport;
    }

    const iceCandidates = transport.iceCandidates as mediasoupClientTypes.IceCandidate[];
    const transportOptions: mediasoupClientTypes.TransportOptions = {
      id: transport.id,
      dtlsParameters: transport.dtlsParameters,
      iceParameters: transport.iceParameters,
      iceCandidates: iceCandidates,
    };
    return transportOptions;

    // const transport = await this.router.createWebRtcTransport({
    //   listenIps: mediasoupConfig.webRtcTransport.listenIps,
    //   enableUdp: true,
    //   enableTcp: true,
    //   preferUdp: true,
    //   initialAvailableOutgoingBitrate,
    // });
    // if (mediasoupConfig.maxIncomingBitrate) {
    //   try {
    //     await transport.setMaxIncomingBitrate(mediasoupConfig.maxIncomingBitrate);
    //   } catch (error) {
    //     console.error('failed to set maximum incoming bitrate');
    //   }
    // }

    // transport.on('dtlsstatechange', (dtlsState: DtlsState) => {

    //   if (dtlsState === 'closed') {
    //     console.log('---transport close--- ' + this.peers.get(socketId)?.name + ' closed');
    //     transport.close();
    //   }
    // });

    // transport.on('close', () => {
    //   console.log('---transport close--- ' + this.peers.get(socketId)?.name + ' closed');
    // });
    // console.log('---adding transport---', transport.id);
    // this.peers.get(socketId)?.addTransport(transport);
    // return {
    //   params: {
    //     id: transport.id,
    //     iceParameters: transport.iceParameters,
    //     iceCandidates: transport.iceCandidates,
    //     dtlsParameters: transport.dtlsParameters,
    //   },
    // };
  }

  async connectTransport(transportId: string, dtlsParameters: DtlsParameters): Promise<void> {

    let chosenTransport;
    if(this.receiveTransport?.id === transportId){
      // await this.receiveTransport.connect({dtlsParameters});
      // return;
      chosenTransport = this.receiveTransport;
    } else if(this.sendTransport?.id === transportId){
      // await this.sendTransport.connect({dtlsParameters});
      // return;
      chosenTransport = this.sendTransport;
    } else{
      // console.error('no transport with that id found');
      return Promise.reject('no transport with that id found!');
    }

    try{
      await chosenTransport.connect({dtlsParameters});
    } catch(err){
      console.error('Failed to connect the transport!');
      return Promise.reject(err);
    }
    // if (!this.transports.has(transportId)) {
    //   console.error(`no transport with id ${transportId} found`);
    //   return;
    // }
    // await this.transports.get(transportId)?.connect({
    //   dtlsParameters: dtlsParameters,
    // });
  }

  //A producer on server side represents a client producing media and sending it to the server.
  async createProducer(rtpParameters: RtpParameters, kind: MediaKind): Promise<Producer> {
    // const producer = await this.transports.get(producerTransportId)?.produce({
    //   kind,
    //   rtpParameters,
    // });
    if(!this.sendTransport){
      return Promise.reject('a transport is required to create a producer!');
    }
    const producer = await this.sendTransport.produce({kind, rtpParameters });

    if(!producer){
      return Promise.reject('failed to create producer');
    }

    this.producers.set(producer.id, producer);

    producer.on('transportclose', () => {
      console.log(`---producer transport close--- name: ${this.name} producer.id: ${producer.id}`);
      producer.close();
      this.producers.delete(producer.id);
    });

    return producer;
  }

  async createConsumer(requestedProducerId: string): Promise<mediasoupClientTypes.ConsumerOptions> {
    const key: string = this.producers.keys().next().value;
    // const producerId = this.producers.get(key).id;
    const producerId = key;
    // const consumer = await this.transports.get(consumerTransportId)?.consume({
    //   producerId: producerId,
    //   rtpCapabilities,
    //   paused: false, //producer.kind === 'video',
    // });
    if(!this.rtpCapabilities) {
      return Promise.reject('rtpCapabilities of peer unknown. Provide them before requesting to consume');
    }
    if(!this.room) {
      return Promise.reject('not in a room. No bueno, homie!');
    }
    const canConsume = this.room.router.canConsume({producerId, rtpCapabilities: this.rtpCapabilities });
    if(!canConsume){
      return Promise.reject('Client is not capable of consuming the producer according to provided rtpCapabilities');
    }
    if(!this.receiveTransport){
      return Promise.reject('A transport is required to create a consumer');
    }
    const consumer = await this.receiveTransport.consume({
      producerId,
      rtpCapabilities: this.rtpCapabilities,
      paused: false,
    });

    if (!consumer) {
      throw 'failed to create consumer';
    }

    // if (consumer.type === 'simulcast') {
    //   await consumer.setPreferredLayers({
    //     spatialLayer: 2,
    //     temporalLayer: 2,
    //   });
    // }

    this.consumers.set(consumer.id, consumer);

    consumer.on('transportclose', () => {
      console.log(`---consumer transport close--- name: ${this.name} consumer_id: ${consumer.id}`);
      this.consumers.delete(consumer.id);
    });

    const consumerOptions: mediasoupClientTypes.ConsumerOptions =  { 
      id: consumer.id,
      producerId: consumer.producerId , 
      kind: consumer.kind, 
      rtpParameters: consumer.rtpParameters,
    };
    return consumerOptions;

    // return {
    //   consumer,
    //   params: {
    //     producerId: producerId,
    //     id: consumer.id,
    //     kind: consumer.kind,
    //     rtpParameters: consumer.rtpParameters,
    //     type: consumer.type,
    //     producerPaused: consumer.producerPaused,
    //   },
    // };
  }

  closeProducer(producerId: string): void {
    try {
      this.producers.get(producerId)?.close();
    } catch (e) {
      console.warn(e);
    }

    this.producers.delete(producerId);
  }

  getProducer(producerId: string): Producer | undefined {
    if(!this.producers.has(producerId)){
      console.error(`producer with id: ${producerId}`);
      throw `producer with id: ${producerId}`;
    }else{
      return this.producers.get(producerId);
    }
  }

  close(): void {
    // this.transports.forEach(transport => transport.close());
    this.receiveTransport?.close();
    this.sendTransport?.close();
  }

  removeConsumer(consumerId: string): void {
    this.consumers.delete(consumerId);
  }

}