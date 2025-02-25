from sortedcontainers import SortedList
from bisect import bisect_left
from OrderTwo import Order
import random
import math

complated_orders = [

]
class OrderManager:
    def __init__(self, name):
        self.buy_orders = SortedList(key=lambda order: order.price)  # Store buy orders sorted by price
        self.sell_orders = SortedList(key=lambda order: order.price)  # Store sell orders sorted by price
        self.orders_by_id = {}  # For O(1) lookup by ID
        self.total_sell_volume = 0
        self.total_buy_volume = 0
        self.num_of_orders = 0
        self.market = 0
        self.name = name
        self.last_order_by_newsBot = 0
        self.buy_orders_sum = 0
        self.sell_orders_sum = 0
        self.till_market = 0

    def add_order(self, order: Order):
        self.orders_by_id[order.order_id] = order
        self.num_of_orders += 1
        if order.order_type == "BUY":
            self.buy_orders_sum += order.price*order.quantity
            self.total_buy_volume += order.quantity_added_to_book
            order.order_type = "BUY"
            self.buy_orders.add(order)
        elif order.order_type == "SELL":
            self.sell_orders_sum += order.price*order.quantity
            self.total_sell_volume += order.quantity_added_to_book
            order.order_type = "SELL"
            self.sell_orders.add(order)

    def remove_order(self, order: Order):
        if self.num_of_orders >= 1:
            self.num_of_orders -= 1
            
        if order.order_type== "BUY":
            if order.quantity > 0:# Called Through Delete Order
                self.buy_orders_sum -= order.price*order.quantity
            else: #Called Normally
                self.buy_orders_sum -= order.price*order.quantity_added_to_book
                
            self.total_buy_volume -= order.quantity_added_to_book
            self.buy_orders.remove(order)
            
        elif order.order_type == "SELL":            
            if order.quantity > 0: # Called Through Delete Order
                self.sell_orders_sum -= order.price*order.quantity
            else: # Called Normally
                self.sell_orders_sum -= order.price*order.quantity_added_to_book
                
            self.total_sell_volume -= order.quantity_added_to_book
            self.sell_orders.remove(order)
            
        del self.orders_by_id[order.order_id]
        
    
    def CosineCalculation(self):
        
        buy_angle = math.pi*(self.total_buy_volume/(self.total_buy_volume+self.total_sell_volume)) if (self.total_buy_volume+self.total_sell_volume) > 0 and math.pi*(self.total_buy_volume/(self.total_buy_volume+self.total_sell_volume)) < math.pi else math.pi
        sell_angle = math.pi*(self.total_sell_volume/(self.total_buy_volume+self.total_sell_volume)) if (self.total_buy_volume+self.total_sell_volume) > 0 and math.pi*(self.total_sell_volume/(self.total_buy_volume+self.total_sell_volume)) < math.pi else math.pi
        
        buy_factor = math.sin( float(buy_angle/2) )
        sell_factor = math.cos( float(sell_angle/2) ) # less sell means more intrest in buying so more sell 
        
        market_price = (self.buy_orders_sum + self.sell_orders_sum) / (self.total_buy_volume + self.total_sell_volume) if self.total_buy_volume + self.total_sell_volume != 0 else 0
        
        market_price = market_price + (market_price * (buy_factor - sell_factor))
        
        return market_price
        


    def cleanup_bot_orders(self):
        if self.num_of_orders == 0:
            return
        
        percent = 2
        market_price = self.last_order_by_newsBot
        lower_threshold = market_price * (100-percent)/100
        upper_threshold = market_price * (100+percent)/100
        
        bot_ids_to_remove = [
            oid for oid, order in self.orders_by_id.items()
            if oid.endswith("+b") and (order.price < lower_threshold or order.price > upper_threshold)
        ]
        
        for bot_id in bot_ids_to_remove:
            self.remove_order_by_id(bot_id)



    def remove_order_by_id(self, order_id: str):
        order = self.orders_by_id.get(order_id)  # Use .get() to avoid KeyError
        if order is None:
            return
        
        self.remove_order(order=order)


    def get_order_by_id(self, order_id: str):
        return self.orders_by_id.get(order_id, None)  # Return None if not found

    def delete_an_order(self, order_id: str)-> dict:

        if order_id not in self.orders_by_id:
            return {
                "order_id" : order_id,
                "done" : False
            }
        else:
            order = self.orders_by_id[order_id]
            data = {
                "done" : True,
                "order_id" : order.order_id,
                "shared_you_get" : order.shares_owned,
                "money_you_get": (order.initial_quantity*order.price- order.amount) if order.order_type == "BUY" else order.amount,
                "transactions": order.transaction
            }
            self.remove_order_by_id(order_id=order_id)

            return data


    def process_incoming_order(self, order: Order):
        array_of_completed_orders = [

        ]

        while True:
            best_order = self.get_best_price(order.price, order_id=order.order_id, userId=order.user_id , incoming_buy=(order.order_type == "BUY"))

            if order.user_id == "bot":
                self.last_order_by_newsBot = order.price
            
            if best_order != -1:

                matched_price = min(best_order.price, order.price)
                matched_quantity = min(best_order.quantity, order.quantity)
                order.quantity -= matched_quantity
                best_order.quantity -= matched_quantity


                #Since order was matched, some units were consumed from either buyers book or sellers book
                #If incoming order was buy order then that means that it matched with sell order
                #Hence some volume and shares must be consumed from the sell List
                #and vice versa

                order.transaction.append(
                    {
                        "quantity": matched_quantity,
                        "price" :  matched_price,
                        "with" : best_order.order_id
                    }
                )

                best_order.transaction.append(
                    {
                        "quantity": matched_quantity,
                        "price" :  matched_price,
                        "with" : order.order_id

                    }
                )
                
                self.market = matched_price

                best_order.amount += matched_price*matched_quantity
                order.amount += matched_price*matched_quantity
                

                if best_order.order_type == "BUY":
                    best_order.shares_owned += matched_quantity
                    order.shares_owned -= matched_quantity

                    #This means that from the buy orderbook some value is consumed
                    # self.total_buy_volume -= matched_quantity
                else:
                    order.shares_owned += matched_quantity
                    best_order.shares_owned -= matched_quantity

                    #This means that from the sell orderbook some value is consumed
                    # self.total_sell_volume -= matched_quantity
                    

                if best_order.quantity == 0:
                    if best_order.initial_quantity != 0:
                        best_order.avg = best_order.amount / best_order.initial_quantity
                    self.remove_order(best_order)
                    array_of_completed_orders.append(best_order)
                
                if order.quantity == 0:
                    if order.initial_quantity != 0:
                        order.avg = order.amount / order.initial_quantity
                    array_of_completed_orders.append(order)
                    return array_of_completed_orders
            else:
                if self.market == 0:
                    self.market = order.price
                break
        
        order.quantity_added_to_book = order.quantity
        self.add_order(order)

        return array_of_completed_orders


    def print_status_of_books(self):
        print("\n\n\nBuy orders: ")
        for o in self.buy_orders:
            print(o)
        print("\nSell Orders")
        for o in self.sell_orders:
            print(o)
        

    def testing_processor(self, order: Order):
        print(f"Before Processing : {order}")
        self.print_status_of_books()

        self.process_incoming_order(order)

        print(f"\n\n\n\nAfter Processing")
        self.print_status_of_books()
        
        
        
    def find_closest_elements(self, lst: SortedList, x: float, order_id, userId: str):
        filtered_orders = []
        for o in lst:
            if not order_id.endswith("+b"):
                print(f"Order id is {order_id} and o.order_id is {o.order_id} for user {userId}")
            if o.user_id == userId:
                continue
            if order_id.endswith("+counter+b") and o.order_id.endswith("+b"):
                continue
            filtered_orders.append(o)

        # Use the filtered orders for price extraction and bisecting
        prices = [order.price for order in filtered_orders]
        pos = bisect_left(prices, x)

        lower = filtered_orders[pos - 1] if pos > 0 else None
        higher = filtered_orders[pos] if pos < len(filtered_orders) else None

        return lower, higher

    def get_best_price(self, price:float, userId: str, order_id : str ,incoming_buy=True)-> Order:
        orders = self.sell_orders if incoming_buy else self.buy_orders
        
        percent = 0.05 / 100
        
        # Check if the price exists in the orders
        closest_lower, closest_upper = self.find_closest_elements( lst= orders, x= price, order_id= order_id , userId= userId)

        l = 1 - percent
        r = 1 + percent

        # For buy orders
        if incoming_buy:
            if closest_upper is not None:
                if closest_lower is not None:
                    return (closest_upper if abs(price - closest_lower.price) > abs(price - closest_upper.price) and price * percent > abs(price - closest_upper.price) 
                            else closest_lower)
                else:
                    return -1 if price * r < closest_upper.price else closest_upper
            else:
                return -1 if closest_lower is None else closest_lower
            
        # For sell orders
        else:
            if closest_lower is not None:
                if closest_upper is not None:
                    return (closest_lower if abs(price - closest_lower.price) < abs(price - closest_upper.price) and abs(price - closest_lower.price) < price * percent 
                            else closest_upper)
                else:
                    return -1 if price * l > closest_lower.price else closest_lower
            else:
                return -1 if closest_upper is None else closest_upper
