from enum import Enum

class OrderType(Enum):
    BUY = "BUY"
    SELL = "SELL"






class Order:
    def __init__(self, order_id: str, time: str, order_type: OrderType, quantity: int, price: float, company_id: str, user_id: str = None):
        
        self.order_id = order_id
        self.time = time
        
        self.order_type = order_type
        self.quantity = quantity
        self.price = price
        self.company_id = company_id
        self.user_id = user_id
        self.initial_quantity = quantity
        self.quantity_added_to_book = 0
        self.transaction = [
            #{
            #   quantity: int
            #   price : float
            #   matched_with : str
            #}
            #
            #
        ]
        self.shares_owned = 0 if self.order_type == "BUY" else self.quantity

        self.amount = 0
        self.avg = -1

    def __lt__(self, other):
        return self.price < other.price  # Compare based on price

    # def __eq__(self, other):
    #     return self.order_id == other.order_id  # Compare based on 

    def __repr__(self):
        return f"Order(id:{self.order_id}, price:{self.price}, quantity:{self.quantity}, type:{self.order_type} ,amount:{self.amount}, avg:{self.avg})"


