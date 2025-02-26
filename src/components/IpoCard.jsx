import React, { useEffect, useState } from "react";
import IpoModal from "../components/IpoModal";

const IpoCard = ({
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
}) => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div
            className="card shadow"
            style={{
                backgroundColor: "#3d3d4d",
                color: "#fefdff",
                borderRadius: "10px",
            }}
        >
            <div
                className="card-body p-2 px-3"
                style={{
                    backgroundColor: "#3d3d4d",
                    color: "#fefdff",
                    borderRadius: "10px",
                }}
            >
                <div className="row row-cols-2 row-cols-sm-4 g-4 align-items-center">
                    <div className="col text-start text-sm-center">
                        <p className="card-text" style={{ fontWeight: "bold" }}>
                            {stock_name}
                        </p>
                    </div>
                    {windowWidth > 576 && (
                        <div className="col text-end text-sm-center">
                            <p className="card-text">{start_date}</p>
                        </div>
                    )}
                    {windowWidth < 576 && (
                        <div className="col text-end text-sm-center">
                            {/* <div
                              className="btn btn-sm subscribe bi bi-eye"
                              data-toggle="modal"
                              onClick={() => window.open(`${red_herring_prospectus}`)}
                            >
                              {" "}
                              View Report
                            </div> */}
                            <div
                                className="btn btn-sm subscribe"
                                data-toggle="modal"
                                data-target={`#modal${id}`}
                            >
                                Subscribe
                            </div>
                            <div>
                                {/* MODAL */}
                                <IpoModal
                                    id={id}
                                    company={id}
                                    stock_name={stock_name}
                                    stock_ticker={stock_ticker}
                                    ceil_price={ceil_price}
                                    floor_price={floor_price}
                                    lot_size={lot_size}
                                    issue_size={issue_size}
                                    red_herring_prospectus={
                                        red_herring_prospectus
                                    }
                                    start_date={start_date}
                                    end_date={end_date}
                                    description={``}
                                />
                            </div>
                        </div>
                    )}

                    {windowWidth > 576 && (
                        <div className="col text-start text-sm-center">
                            <p className="card-text">{end_date}</p>
                        </div>
                    )}

                    {windowWidth < 576 && (
                        <div className="col text-start text-sm-center">
                            <p className="card-text">{start_date}</p>
                        </div>
                    )}

                    {windowWidth > 576 && (
                        <div className="col text-end text-sm-center">
                            {/* <div
                              className="btn btn-sm subscribe bi bi-eye"
                              data-toggle="modal"
                              onClick={() => window.open(`${red_herring_prospectus}`)}
                            >
                              {" "}
                              View Report
                            </div> */}
                            <div
                                className="btn btn-sm subscribe"
                                data-toggle="modal"
                                data-target={`#modal${id}`}
                            >
                                Subscribe
                            </div>
                            <div>
                                {/* MODAL */}
                                <IpoModal
                                    id={id}
                                    company={id}
                                    stock_name={stock_name}
                                    stock_ticker={stock_ticker}
                                    ceil_price={ceil_price}
                                    floor_price={floor_price}
                                    lot_size={lot_size}
                                    issue_size={issue_size}
                                    red_herring_prospectus={
                                        red_herring_prospectus
                                    }
                                    start_date={start_date}
                                    end_date={end_date}
                                    description={``}
                                />
                            </div>
                        </div>
                    )}

                    {windowWidth < 576 && (
                        <div className="col text-end text-sm-center">
                            <p className="card-text">{end_date}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IpoCard;
