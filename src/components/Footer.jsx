import React from "react";

const Footer = () => {
    return (
        <div>
            <footer className="fixed-bottom footer">
                <div className="container text-center d-flex justify-content-center">
                    <p
                        className="mb-0 text-light"
                        style={{ marginRight: "5px" }}
                    >
                        Designed & developed by -
                    </p>
                    <a
                        className="text-decoration-none text-light"
                        href="https://wallstreet-webteam.vercel.app"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <u> Web Team</u>
                    </a>
                </div>
            </footer>
        </div>
    );//ea
};

export default Footer;
