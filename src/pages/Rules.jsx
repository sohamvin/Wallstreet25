import React from "react";

const Rules = () => {
    return (
        <div className="container rulesPage mb-5">
            <div className="rulesCard">
                <div className="card-header rulesCardTitle border-0 text-center">
                    Rules
                </div>
                <div className="card-body text-align-justify fs-6 p-sm-5">
                    <ol>
                        <li>Each participant must use their email and password from the Credenz website to log in to the Wallstreet trading platform and start playing.</li>
                        <br />
                        <li>Each participant will receive an initial cash amount of ₹1,00,000, which can be used to purchase stocks. No additional funds will be provided during the competition.</li>
                        <br />
                        <li>
                            Market Timings:
                            <ul>
                                <li>Day 1 & Day 2: The market will be open from 1:00 PM to 6.30 PM.</li>
                                <li>Day 3: The market will be open from 9:00 AM to 4:00 PM.</li>
                            </ul>
                        </li>
                        <br/>
                        <li>Upon partial order execution, cancellation of the remaining portion will result in portfolio adjustments reflecting the updated share and cash balances.</li>
                        <br/>
                        <li> Each stock has an upper and lower circuit limit of 12%, meaning the you cannot purchase a stock with increase or decrease by more than 12% in any trade. </li>
                        <br />
                        <li>Company information will be available on the company page within the platform.</li>
                        <br />
                        <li>Participants cannot buy and sell stocks after market hours.</li>
                        <br />
                        <li>
                            Participant rankings will be determined based on their valuation amount, calculated as the net sum of:
                            <ul>
                                <li>The total asset value of acquired shares (based on current market prices).</li>
                                <li>The remaining cash balance in the participant’s account.</li>
                            </ul>
                        </li>
                        <br />
                        <li>News updates about listed companies will be displayed every 20 minutes. These updates may suggest stock price movements but do not guarantee any specific direction, reflecting real-world market behavior.</li>
                        <br />
                        <li>The organizing team reserves the right to monitor trading activity and take necessary action against rule violations.</li>
                        <br />
                        <li>Participants may be disqualified for malpractice.</li>
                        <br />
                        <li>The decision of the organizing team will be final.</li>
                    </ol>
                </div>
            </div>
            <br />
        </div>
    );
};

export default Rules;
