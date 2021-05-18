import { Consumer, DtlsParameters, MediaKind, Producer, RtpCapabilities, RtpParameters, WebRtcTransport } from 'mediasoup/lib/types';

export default class Peer {
  socketId: string;
  name: string;
  transports: Map<string, WebRtcTransport>;
  consumers: Map<string, Consumer>;
  producers: Map<string, Producer>;


  constructor(socketId: string, name: string) {
    this.socketId = socketId;
    this.name = name;
    this.transports = new Map();
    this.consumers = new Map();
    this.producers = new Map();
  }

  addTransport(transport: WebRtcTransport): void {
    this.transports.set(transport.id, transport);
  }

  async connectTransport(transportId: string, dtlsParameters: DtlsParameters): Promise<void> {
    if (!this.transports.has(transportId)) {
      console.error(`no transport with id ${transportId} found`);
      return;
    }
    await this.transports.get(transportId)?.connect({
      dtlsParameters: dtlsParameters,
    });
  }

  async createProducer(producerTransportId: string, rtpParameters: RtpParameters, kind: MediaKind): Promise<Producer> {
    const producer = await this.transports.get(producerTransportId)?.produce({
      kind,
      rtpParameters,
    });

    if(!producer){
      throw 'failed to create producer';
    }

    this.producers.set(producer.id, producer);

    producer.on('transportclose', () => {
      console.log(`---producer transport close--- name: ${this.name} producer.id: ${producer.id}`);
      producer.close();
      this.producers.delete(producer.id);
    });

    return producer;
  }

  async createConsumer(consumerTransportId: string, producerId: string, rtpCapabilities: RtpCapabilities): Promise<{consumer: Consumer; params: Record<string, unknown>;}> {
    const consumer = await this.transports.get(consumerTransportId)?.consume({
      producerId: producerId,
      rtpCapabilities,
      paused: false, //producer.kind === 'video',
    });

    if (!consumer) {
      throw 'failed to create consumer';
    }

    if (consumer.type === 'simulcast') {
      await consumer.setPreferredLayers({
        spatialLayer: 2,
        temporalLayer: 2,
      });
    }

    this.consumers.set(consumer.id, consumer);

    consumer.on('transportclose', () => {
      console.log(`---consumer transport close--- name: ${this.name} consumer_id: ${consumer.id}`);
      this.consumers.delete(consumer.id);
    });

    return {
      consumer,
      params: {
        producerId: producerId,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
      },
    };
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
    this.transports.forEach(transport => transport.close());
  }

  removeConsumer(consumerId: string): void {
    this.consumers.delete(consumerId);
  }

}