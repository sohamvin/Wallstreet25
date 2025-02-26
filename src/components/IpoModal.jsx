import React from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ipoService } from "../services/apis";
import { useAuthContext } from "../hooks/useAuthContext";

const IpoModal = ({
    id,
    stock_name,
    stock_ticker,
    start_date,
    end_date,
    floor_price,
    ceil_price,
    lot_size,
    red_herring_prospectus,
    issue_size,
    description,
}) => {
    const { user } = useAuthContext();
    const [qty, setQty] = useState(0);
    const [bid, setBid] = useState(0);

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (!user) {
            toast.error("You must be logged in to perform this action", {
                position: toast.POSITION.TOP_RIGHT,
                theme: "dark",
            });
        } else {
            const data = {
                bid_quantity: qty,
                bid_price: bid,
            };
            ipoService
                .subscribeIpo(id, data)
                .then((response) => {
                    toast.success(response.detail);
                })
                .catch((error) => {
                    toast.error(error.data.detail);
                    console.clear()
                });
        }
    };

    return (
        <div
            className="modal fade"
            id={`modal${id}`}
            tabindex="-1"
            role="dialog"
            aria-labelledby="exampleModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog align-item-center" role="document">
                <div className="ipoModal modal-content">
                    <div className="modal-header mt-3 border-0">
                        <h3
                            className="modaltitle text-center"
                            id="exampleModalLabel"
                        >
                            {stock_ticker} - {stock_name}
                        </h3>

                        <div
                            type="button"
                            className="modalclosebtn close m-2"
                            data-dismiss="modal"
                            aria-label="Close"
                        >
                            <span aria-hidden="true">&times;</span>
                        </div>
                    </div>

                    <div className="modal-body justify-content-center">

                        {/* <div className="modalcontent mx-3">{description}</div> */}

                        <div className="details mx-3">
                            <div className="row">
                                <div className="col-6">
                                    <p className="mb-0 ipodetailtitle mt-2">
                                        Price Band
                                    </p>
                                    <p className="mt-0">
                                        ₹{floor_price} - ₹{ceil_price}
                                    </p>

                                    <p className="mb-0 ipodetailtitle mt-4">
                                        Bid Price
                                    </p>
                                    <div>
                                        <input
                                            className="stockquantity mt-1"
                                            type="number"
                                            onChange={(e) =>
                                                setBid(e.target.value)
                                            }
                                            value={bid}
                                        />
                                    </div>
                                </div>

                                <div className="col-6 text-end ">
                                    <p className="mb-0 ipodetailtitle mt-2">
                                        Issue Size
                                    </p>
                                    <p className="mt-0">{issue_size}</p>

                                    <p className="mb-0 ipodetailtitle mt-4">
                                        Lot Qty
                                    </p>
                                    <div>
                                        <input
                                            className="stockquantity mt-1"
                                            type="number"
                                            onChange={(e) =>
                                                setQty(e.target.value)
                                            }
                                            value={qty}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        className="text-warning mb-3 mt-3"
                        style={{ fontSize: "17px" }}
                    >{`[ One lot is equal to ${lot_size} shares, hence your total transaction value will be ₹${
                        qty * bid * lot_size
                    } ]`}</div>
                    <div
                        className="text-warning mb-3"
                        style={{ fontSize: "17px" }}
                    >
                        [ Note : Once subscribed you won't be able to cancel or
                        resubscribe the ipo ]
                    </div>
                    <div className="modal-footer border-0 align-items-center">
                        <button
                            type="button"
                            className="btn btn-primary mx-3 mb-4 bi bi-eye"
                            onClick={() =>
                                window.open(`${red_herring_prospectus}`)
                            }
                        >
                            {" "}
                            View Report{" "}
                        </button>
                        <button
                            type="button"
                            className="btn btn-success mx-3 mb-4"
                            onClick={handleSubscribe}
                        >
                            Subscribe
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IpoModal;
