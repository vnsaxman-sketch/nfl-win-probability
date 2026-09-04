import { useState } from "react";

type Possession = "home" | "away";

type TurnoverStatus =
  | "No Turnover"
  | "Interception"
  | "Fumble";

interface NFLInputs {
  homeScore: number;
  awayScore: number;
  quarter: string;
  minutesLeft: number;
  secondsLeft: number;
  yardline: number;
  down: number;
  distance: number;
  possessionTeam: Possession;
  turnoverStatus: TurnoverStatus;
  homeTimeouts: number;
  awayTimeouts: number;
  moneylineOdds: number;
  unitSize: number;
}

interface Results {
  probability: number;
  impliedProbability: number;
  edge: number;
  betType: string;
  betAmount: string;
  propsBet: string;
  totalsBet: string;
  firstHalfBet: string;
  nicheAngle: string;
}

function NFLWinProbability() {
  const [homeScore, setHomeScore] = useState("0");
  const [awayScore, setAwayScore] = useState("0");

  const [quarter, setQuarter] = useState("4");
  const [minutesLeft, setMinutesLeft] = useState("15");
  const [secondsLeft, setSecondsLeft] = useState("0");

  const [yardline, setYardline] = useState("75");
  const [down, setDown] = useState("1");
  const [distance, setDistance] = useState("10");

  const [possessionTeam, setPossessionTeam] =
    useState<Possession>("home");

  const [turnoverStatus, setTurnoverStatus] =
    useState<TurnoverStatus>("No Turnover");

  const [homeTimeouts, setHomeTimeouts] = useState("3");
  const [awayTimeouts, setAwayTimeouts] = useState("3");

  const [unitSize, setUnitSize] = useState("10");
  const [moneylineOdds, setMoneylineOdds] = useState("-110");

  const [results, setResults] = useState<Results>({
    probability: 0,
    impliedProbability: 0,
    edge: 0,
    betType: "--",
    betAmount: "--",
    propsBet: "--",
    totalsBet: "--",
    firstHalfBet: "--",
    nicheAngle: "--",
  });

  const [error, setError] = useState("");

  function calculateImpliedProbability(odds: number): number {
    if (odds > 0) {
      return 100 / (odds + 100);
    }

    if (odds < 0) {
      return Math.abs(odds) / (Math.abs(odds) + 100);
    }

    return 0.5;
  }

  function calculateSagarinWinProbability(
    homeScoreValue: number,
    awayScoreValue: number,
    totalTime: number,
    _homePossession: number,
    _timeoutDifferential: number,
    _turnoverStatus: string
  ): number {
    let pointDiff =
      homeScoreValue - awayScoreValue;

    // Home-field advantage
    pointDiff += 2.5;

    let sagarinProbability: number;

    if (totalTime > 0) {
      const timeFactor =
        1 - totalTime / 60.0;

      sagarinProbability =
        0.5 +
        (pointDiff / 50.0) * timeFactor;
    } else {
      if (pointDiff > 0) {
        sagarinProbability = 1.0;
      } else if (pointDiff < 0) {
        sagarinProbability = 0.0;
      } else {
        sagarinProbability = 0.5;
      }
    }

    // Clamp between 1% and 99%
    return Math.max(
      0.01,
      Math.min(0.99, sagarinProbability)
    );
  }

  function calculateWinProbability() {
    setError("");

    try {
      const inputs: NFLInputs = {
        homeScore: parseInt(homeScore, 10),
        awayScore: parseInt(awayScore, 10),
        quarter,
        minutesLeft: parseInt(minutesLeft, 10),
        secondsLeft: parseInt(secondsLeft, 10),
        yardline: parseInt(yardline, 10),
        down: parseInt(down, 10),
        distance: parseInt(distance, 10),
        possessionTeam,
        turnoverStatus,
        homeTimeouts: parseInt(homeTimeouts, 10),
        awayTimeouts: parseInt(awayTimeouts, 10),
        moneylineOdds: parseFloat(moneylineOdds),
        unitSize: parseFloat(unitSize),
      };

      if (
        !Number.isFinite(inputs.homeScore) ||
        !Number.isFinite(inputs.awayScore) ||
        !Number.isFinite(inputs.minutesLeft) ||
        !Number.isFinite(inputs.secondsLeft) ||
        !Number.isFinite(inputs.yardline) ||
        !Number.isFinite(inputs.distance) ||
        !Number.isFinite(inputs.homeTimeouts) ||
        !Number.isFinite(inputs.awayTimeouts) ||
        !Number.isFinite(inputs.moneylineOdds) ||
        !Number.isFinite(inputs.unitSize)
      ) {
        throw new Error(
          "Please enter valid numeric values."
        );
      }

      const totalTimeInMinutes =
        inputs.minutesLeft +
        inputs.secondsLeft / 60;

      const homePossession =
        inputs.possessionTeam === "home"
          ? 1
          : 0;

      const timeoutDifferential =
        inputs.homeTimeouts -
        inputs.awayTimeouts;

      const probability =
        calculateSagarinWinProbability(
          inputs.homeScore,
          inputs.awayScore,
          totalTimeInMinutes,
          homePossession,
          timeoutDifferential,
          inputs.turnoverStatus
        );

      const impliedProbability =
        calculateImpliedProbability(
          inputs.moneylineOdds
        );

      const edge =
        (probability - impliedProbability) * 100;

      /*
       * Betting suggestion
       */
      let betType: string;
      let betAmount: string;

      if (probability > 0.70) {
        betType = "Moneyline Bet";
        betAmount = `${(
          inputs.unitSize * 2
        ).toFixed(2)} Units`;
      } else if (probability > 0.50) {
        betType = "Point Spread Bet";
        betAmount = `${(
          inputs.unitSize
        ).toFixed(2)} Units`;
      } else {
        betType = "Parlay/Long-shot Bet";
        betAmount = `${(
          inputs.unitSize * 0.5
        ).toFixed(2)} Units`;
      }

      /*
       * Totals
       */
      const totalScore =
        inputs.homeScore +
        inputs.awayScore;

      const timeLeftInGame =
        inputs.minutesLeft +
        inputs.secondsLeft / 60;

      let totalsBet = "--";

      if (
        totalScore < 20 &&
        timeLeftInGame < 5
      ) {
        totalsBet = "Bet the UNDER";
      } else if (
        totalScore > 35 &&
        ["1", "2"].includes(inputs.quarter) &&
        timeLeftInGame > 10
      ) {
        totalsBet = "Bet the OVER";
      }

      /*
       * Props
       */
      let propsBet = "--";

      if (
        inputs.down === 3 &&
        inputs.distance > 8
      ) {
        propsBet =
          "QB Passing Yards/Attempts Over";
      } else if (
        inputs.down === 1 &&
        inputs.distance <= 5 &&
        inputs.yardline < 20
      ) {
        propsBet =
          "RB Rushing Yards/Touchdown";
      }

      /*
       * First-half
       */
      let firstHalfBet = "--";

      if (
        ["1", "2"].includes(inputs.quarter) &&
        Math.abs(
          inputs.homeScore -
            inputs.awayScore
        ) <= 3
      ) {
        firstHalfBet =
          "Bet on the winning team at the half";
      }

      /*
       * Niche angle
       */
      let nicheAngle = "--";

      if (
        inputs.turnoverStatus ===
          "Fumble" ||
        inputs.turnoverStatus ===
          "Interception"
      ) {
        nicheAngle =
          "Bet on another Turnover";
      }

      setResults({
        probability,
        impliedProbability,
        edge,
        betType,
        betAmount,
        propsBet,
        totalsBet,
        firstHalfBet,
        nicheAngle,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to calculate probability."
      );
    }
  }

  function escapeCsvValue(value: string): string {
    if (
      value.includes(",") ||
      value.includes('"') ||
      value.includes("\n")
    ) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  function saveToCSV() {
    const rows = [
      [
        "homeScore",
        "awayScore",
        "quarter",
        "minutesLeft",
        "secondsLeft",
        "yardline",
        "down",
        "distance",
        "possessionTeam",
        "turnoverStatus",
        "homeTimeouts",
        "awayTimeouts",
        "moneylineOdds",
        "unitSize",
      ],
      [
        homeScore,
        awayScore,
        quarter,
        minutesLeft,
        secondsLeft,
        yardline,
        down,
        distance,
        possessionTeam,
        turnoverStatus,
        homeTimeouts,
        awayTimeouts,
        moneylineOdds,
        unitSize,
      ],
    ];

    const csvContent = rows
      .map((row) =>
        row
          .map((value) =>
            escapeCsvValue(String(value))
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "nfl_win_probability_inputs.csv";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <div className="main-container">
        <h1>
          In Game NFL Win Probability Calculator
        </h1>

        <p className="educational">
          Educational Purpose
        </p>

        {/* SCORE */}
        <section className="section">
          <h2>Score</h2>

          <div className="input-row">
            <label>Home Score:</label>

            <input
              type="number"
              value={homeScore}
              min="0"
              onChange={(e) =>
                setHomeScore(e.target.value)
              }
            />
          </div>

          <div className="input-row">
            <label>Away Score:</label>

            <input
              type="number"
              value={awayScore}
              min="0"
              onChange={(e) =>
                setAwayScore(e.target.value)
              }
            />
          </div>
        </section>

        {/* TIME */}
        <section className="section">
          <h2>Time & Quarter</h2>

          <div className="input-row">
            <label>Quarter:</label>

            <select
              value={quarter}
              onChange={(e) =>
                setQuarter(e.target.value)
              }
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="Overtime">
                Overtime
              </option>
            </select>
          </div>

          <div className="input-row">
            <label>Minutes Left:</label>

            <input
              type="number"
              value={minutesLeft}
              min="0"
              onChange={(e) =>
                setMinutesLeft(e.target.value)
              }
            />
          </div>

          <div className="input-row">
            <label>Seconds Left:</label>

            <input
              type="number"
              value={secondsLeft}
              min="0"
              max="59"
              onChange={(e) =>
                setSecondsLeft(e.target.value)
              }
            />
          </div>
        </section>

        {/* FIELD POSITION */}
        <section className="section">
          <h2>Field Position & Down</h2>

          <div className="input-row">
            <label>Down:</label>

            <select
              value={down}
              onChange={(e) =>
                setDown(e.target.value)
              }
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>

          <div className="input-row">
            <label>Yards to Goal Line:</label>

            <input
              type="number"
              value={yardline}
              min="0"
              max="100"
              onChange={(e) =>
                setYardline(e.target.value)
              }
            />
          </div>

          <div className="input-row">
            <label>Yards to Go:</label>

            <input
              type="number"
              value={distance}
              min="0"
              onChange={(e) =>
                setDistance(e.target.value)
              }
            />
          </div>
        </section>

        {/* POSSESSION */}
        <section className="section">
          <h2>Team with Possession</h2>

          <div className="radio-row">
            <label>
              <input
                type="radio"
                name="possession"
                value="home"
                checked={
                  possessionTeam === "home"
                }
                onChange={() =>
                  setPossessionTeam("home")
                }
              />

              <span>Home Team</span>
            </label>

            <label>
              <input
                type="radio"
                name="possession"
                value="away"
                checked={
                  possessionTeam === "away"
                }
                onChange={() =>
                  setPossessionTeam("away")
                }
              />

              <span>Away Team</span>
            </label>
          </div>
        </section>

        {/* TURNOVER */}
        <section className="section">
          <h2>Turnover Status</h2>

          <div className="input-row">
            <label>Turnover:</label>

            <select
              value={turnoverStatus}
              onChange={(e) =>
                setTurnoverStatus(
                  e.target.value as TurnoverStatus
                )
              }
            >
              <option value="No Turnover">
                No Turnover
              </option>

              <option value="Interception">
                Interception
              </option>

              <option value="Fumble">
                Fumble
              </option>
            </select>
          </div>
        </section>

        {/* TIMEOUTS */}
        <section className="section">
          <h2>Timeouts</h2>

          <div className="input-row">
            <label>Home Timeouts:</label>

            <input
              type="number"
              value={homeTimeouts}
              min="0"
              max="3"
              onChange={(e) =>
                setHomeTimeouts(e.target.value)
              }
            />
          </div>

          <div className="input-row">
            <label>Away Timeouts:</label>

            <input
              type="number"
              value={awayTimeouts}
              min="0"
              max="3"
              onChange={(e) =>
                setAwayTimeouts(e.target.value)
              }
            />
          </div>
        </section>

        {/* BETTING */}
        <section className="section">
          <h2>Betting Suggestions</h2>

          <div className="input-row">
            <label>User Unit Size:</label>

            <input
              type="number"
              value={unitSize}
              min="0"
              step="0.01"
              onChange={(e) =>
                setUnitSize(e.target.value)
              }
            />
          </div>

          <div className="input-row">
            <label>Moneyline Odds:</label>

            <input
              type="number"
              value={moneylineOdds}
              onChange={(e) =>
                setMoneylineOdds(e.target.value)
              }
            />
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* RESULTS */}
        <section className="results">
          <div className="win-probability">
            Win Probability:{" "}
            {results.probability > 0
              ? `${(
                  results.probability * 100
                ).toFixed(2)}%`
              : "--%"}
          </div>

          <div className="result-row suggested">
            <span>Suggested Bet:</span>
            <strong>
              {results.betType}
            </strong>
          </div>

          <div className="result-row amount">
            <span>Suggested Amount:</span>
            <strong>
              {results.betAmount}
            </strong>
          </div>

          <div className="result-row">
            <span>Props Bet:</span>
            <strong>
              {results.propsBet}
            </strong>
          </div>

          <div className="result-row">
            <span>Totals Bet:</span>
            <strong>
              {results.totalsBet}
            </strong>
          </div>

          <div className="result-row">
            <span>First-Half Bet:</span>
            <strong>
              {results.firstHalfBet}
            </strong>
          </div>

          <div className="result-row">
            <span>Niche Angle:</span>
            <strong>
              {results.nicheAngle}
            </strong>
          </div>

          <div className="result-row implied">
            <span>
              Implied Probability:
            </span>

            <strong>
              {results.impliedProbability > 0
                ? `${(
                    results.impliedProbability *
                    100
                  ).toFixed(2)}%`
                : "--%"}
            </strong>
          </div>

          <div className="result-row edge">
            <span>Edge:</span>

            <strong>
              {results.probability > 0
                ? `${results.edge.toFixed(2)}%`
                : "--%"}
            </strong>
          </div>
        </section>

        {/* BUTTONS */}
        <div className="button-container">
          <button
            className="calculate-button"
            onClick={calculateWinProbability}
          >
            Calculate
          </button>

          <button
            className="csv-button"
            onClick={saveToCSV}
          >
            Save to CSV
          </button>
        </div>

        <div className="footer">
          NFL Win Probability Calculator
          <br />
          Educational Purpose
          <br />
          Long Nguyen
        </div>
      </div>
    </div>
  );
}

export default NFLWinProbability;
