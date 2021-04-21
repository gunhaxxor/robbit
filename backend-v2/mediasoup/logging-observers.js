const mediasoup = require("mediasoup");

mediasoup.observer.on("newworker", (worker) =>
{
  console.log("new worker created [worke.pid:%d]", worker.pid);

  worker.observer.on("close", () => 
  {
    console.log("worker closed [worker.pid:%d]", worker.pid);
  });

  worker.observer.on("newrouter", (router) =>
  {
    console.log(
      "new router created [worker.pid:%d, router.id:%s]",
      worker.pid, router.id);

    router.observer.on("close", () => 
    {
      console.log("router closed [router.id:%s]", router.id);
    });

    router.observer.on("newtransport", (transport) =>
    {
      console.log(
        "new transport created [worker.pid:%d, router.id:%s, transport.id:%s]",
        worker.pid, router.id, transport.id);

      transport.observer.on("close", () => 
      {
        console.log("transport closed [transport.id:%s]", transport.id);
      });

      transport.observer.on("newproducer", (producer) =>
      {
        console.log(
          "new producer created [worker.pid:%d, router.id:%s, transport.id:%s, producer.id:%s]",
          worker.pid, router.id, transport.id, producer.id);

        producer.observer.on("close", () => 
        {
          console.log("producer closed [producer.id:%s]", producer.id);
        });
      });

      transport.observer.on("newconsumer", (consumer) =>
      {
        console.log(
          "new consumer created [worker.pid:%d, router.id:%s, transport.id:%s, consumer.id:%s]",
          worker.pid, router.id, transport.id, consumer.id);

        consumer.observer.on("close", () => 
        {
          console.log("consumer closed [consumer.id:%s]", consumer.id);
        });
      });

      transport.observer.on("newdataproducer", (dataProducer) =>
      {
        console.log(
          "new data producer created [worker.pid:%d, router.id:%s, transport.id:%s, dataProducer.id:%s]",
          worker.pid, router.id, transport.id, dataProducer.id);

        dataProducer.observer.on("close", () => 
        {
          console.log("data producer closed [dataProducer.id:%s]", dataProducer.id);
        });
      });

      transport.observer.on("newdataconsumer", (dataConsumer) =>
      {
        console.log(
          "new data consumer created [worker.pid:%d, router.id:%s, transport.id:%s, dataConsumer.id:%s]",
          worker.pid, router.id, transport.id, dataConsumer.id);

        dataConsumer.observer.on("close", () => 
        {
          console.log("data consumer closed [dataConsumer.id:%s]", dataConsumer.id);
        });
      });
    });
  });
});