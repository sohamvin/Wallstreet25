#!/usr/bin/env node

const amqp = require('amqplib/callback_api');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { formatISO } = require("date-fns");
function spacesToUnderscores(str) {
  return str.replace(/ /g, "_");
}

function underscoresToSpaces(str) {
  return str.replace(/_/g, " ");
}

amqp.connect('amqp://localhost', function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }
    const exchange = 'complete_delete';

    channel.assertExchange(exchange, 'direct', {
      durable: false,
    });

    // {"order_id": "e10c6510-f9ba-47b1-a1fa-412cce8c864d", "time": "2025-02-18T12:43:46+05:30", "order_type": "BUY", "quantity": 0, "price": 974, "company_id": "Bharat Steel Works Limited", "user_id": "cm7a4dk8w0005k7ahxqtpcqe1", "initial_quantity": 10, "transaction": [{"quantity": 5, "price": 973.8870126346849, "with": "b96f3d92-d589-420e-81b8-64ada464c389+newbot+b"}, {"quantity": 5, "price": 973.8461553831652, "with": "af1f1de8-6cf2-473d-b388-42c78d669ed3+newbot+b"}], "shares_owned": 10, "amount": 9738.66584008925, "avg": 973.866584008925}

    const queues = ['COMPLETE', 'DELETE'];

    queues.forEach((queue) => {
      channel.assertQueue(queue, { durable: true }, function (error2, q) {
        if (error2) {
          throw error2;
        }
        console.log(` [*] Waiting for messages in queue ${queue}. To exit press CTRL+C`);

        channel.bindQueue(q.queue, exchange, queue);

        channel.consume(q.queue, async function (msg) {
          if (msg.content) {
            console.log(` [x] Received ${queue} message: ${msg.content.toString()}`);
            const order = JSON.parse(msg.content.toString());

            const existingOrder = await prisma.order.findUnique({
              where: { order_id: order.order_id },
            });

            
            let user = null;
            let portfolio = null;

            if (!existingOrder) {
              console.log(`❌ Order ${order.order_id} not found. Skipping update.`);
              channel.ack(msg);
              return;
            } else {
              user = await prisma.user.findUnique({
                where: { id: existingOrder.userId },
              });
              portfolio = await prisma.userHolding.findFirst({
                where: { userId: existingOrder.userId, companyName: existingOrder.companyName },
                });

              if(!user || !portfolio){
                console.log(`❌ User or portfolio not found. Skipping update.`);
                channel.ack(msg);
                return;
                }
            }
            // await prisma.$transaction(async (prisma) => {
            //     // Lock the entire UserHolding table
            //     await prisma.$executeRaw`LOCK TABLE "UserHolding" IN EXCLUSIVE MODE`;
  
            if (queue === 'COMPLETE' && !order.order_id.endsWith('+b')) {
                try {
                  console.log(`✅ Updating order ${order.order_id} to COMPLETED`);
                  await prisma.order.update({
                    where: { order_id: order.order_id },
                    data: {
                      transactions: order.transaction,
                      amount: order.amount,
                      status: 'COMPLETED',
                      datetimeCompleted: new Date(formatISO(new Date())),
                    },
                  });

                  const cashInvestedFolio = portfolio.averagePrice*(portfolio.quantity + portfolio.lockedSharesForSell);

                //   order.order_type = order.order_type.toUpperCase();

                  if (order.order_type.toUpperCase() === 'BUY') {
                    await prisma.userHolding.update({
                        where: { id: portfolio.id },
                        data: {
                            quantity: { increment: existingOrder.quantity },
                            averagePrice : (cashInvestedFolio + order.amount) / (portfolio.quantity + portfolio.lockedSharesForSell + existingOrder.quantity),
                        },
                    });

                    if(existingOrder.price*existingOrder.quantity > order.amount){
                        await prisma.user.update({
                            where: { id: existingOrder.userId },
                            data: {
                                cash: { increment: parseFloat( existingOrder.price*existingOrder.quantity -  order.amount) },
                            },
                        });
                    }

                  } else if (order.order_type.toUpperCase() === 'SELL' && existingOrder) {
                    await prisma.user.update({
                        where: { id: existingOrder.userId },
                        data: {
                            cash: { increment: order.amount },
                        },
                    });
                    const sellAvg = parseFloat(order.amount)/ parseFloat(existingOrder.quantity);

                    const newAvg = parseFloat(portfolio.averagePrice) +  (parseFloat(sellAvg) - parseFloat(portfolio.averagePrice)) / parseFloat(portfolio.quantity + portfolio.lockedSharesForSell);

                    await prisma.userHolding.update({
                        where: { id: portfolio.id },
                        data: {
                            lockedSharesForSell: { decrement: existingOrder.quantity },
                            averagePrice : newAvg,
                        },
                    });

                  }
                } catch (e) {
                  if (e.code === 'P2002') {
                    console.log(`⚠️ Collision detected: Order ${order.order_id} already exists.`);
                  } else {
                    console.error(`❌ Error processing order ${order.order_id}:`, e);
                  }
                }


            } else if (queue === 'DELETE' && !order.order_id.endsWith('+b')) {
                if(order.done){
              
                  if (existingOrder.status !== "PENDING") {
                    console.log(`Order ${order.order_id} is in ${existingOrder.status} state and cannot be canceled.`);
                    channel.ack(msg);
                    return;
                  }
                  try {
                    existingOrder.order_type = existingOrder.order_type.toUpperCase();
                    console.log(`🚨 Deleting order ${order.order_id}`);
                    await prisma.order.update({
                      where: { order_id: existingOrder.order_id },
                      data: {
                        status: 'CANCELED',
                        // amount: existingOrder.quantity*existingOrder.price - order.money_you_get || 0, // amount for which the order was executed
                        datetimeCompleted: formatISO(new Date()),
                        transactions: order.transactions,
                      },
                    });

                    await prisma.user.update({
                      where: { id: existingOrder.userId },
                      data: {
                        cash: { increment: order.money_you_get || 0 },
                      },
                    });

                    const cashInvestedFolio = existingOrder.quantity*existingOrder.price - order.money_you_get || 0;

                    if (existingOrder.order_type === 'BUY') {

                      if(order.shared_you_get > 0){
                          const Amt = portfolio.averagePrice*(portfolio.quantity + portfolio.lockedSharesForSell);
                          const newAvg = (Amt + cashInvestedFolio) / (portfolio.quantity + portfolio.lockedSharesForSell + order.shared_you_get);
                          await prisma.userHolding.update({
                            where: { id: portfolio.id },
                            data: {
                              quantity: { increment: order.shared_you_get },
                              averagePrice : newAvg,
                            },
                          });
                       }

                    } else if (existingOrder.order_type === 'SELL') {
                        const SharesSold = parseFloat(existingOrder.quantity)- parseFloat(order.shared_you_get);
                        if(SharesSold > 0){
                            const SharesSoldAVG = parseFloat(order.money_you_get)/parseFloat(SharesSold);
                            // const newAvg =portfolio.averagePrice + (SharesSoldAVG - portfolio.averagePrice) / (portfolio.quantity + portfolio.lockedSharesForSell - order.shared_you_get);
                            const newAvg =parseFloat(portfolio.averagePrice) + (parseFloat(SharesSoldAVG) - parseFloat(portfolio.averagePrice)) / (parseFloat(portfolio.quantity) + parseFloat(portfolio.lockedSharesForSell));

                            await prisma.userHolding.update({
                                where: { id: portfolio.id },
                                data: {
                                    quantity: { increment: parseInt(order.shared_you_get) },
                                    averagePrice : newAvg,
                                    lockedSharesForSell: {
                                        decrement: parseInt(existingOrder.quantity)
                                    }
                                },
                            });
                        
                        }
                        else {
                          await prisma.userHolding.update({
                            where: { id: portfolio.id },
                            data: {
                                lockedSharesForSell: {
                                    decrement: parseInt(existingOrder.quantity)
                                },
                                quantity: { increment: parseInt(order.shared_you_get) },
                            },
                        });
                        }
                    }
                  } catch (e) {
                    console.error(`❌ Error deleting order ${order.order_id}:`, e);
                  }

                } else {

                }
              } else {
                console.log(`❌ Invalid message format: ${msg.content.toString()}`);
              }

            // });

            channel.ack(msg);
          }
        }, { noAck: false });
      });
    });
  });
});

