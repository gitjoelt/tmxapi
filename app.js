const express = require("express");
const app = express();
const axios = require("axios");
const cheerio = require("cheerio");
const port = 3000;

const getQuote = async ticker => {
    const rsp = await axios.get(`https://web.tmxmoney.com/quote.php?qm_symbol=${ticker}`);
    const html = cheerio.load(rsp.data);
    let price = html(".labs-symbol > .price span").text();
    let volume = html(".symbol-index > .row > .col-4").text();
    volume = volume.replace("VOLUME", "").trim();
    let prevClose;

    const rows = html(".tmx-panel-body > .row > .col-6").toArray() || [];
    if (rows.length > 0) {
        rows.forEach(element => {
            let temp = html(element).find(".dq-card").text();
            if (temp.search("Prev. Close:") !== -1) {
                prevClose = html(element).find(".dq-card > strong").text().trim();
            }
        });
    }

    let pointgl = price - prevClose;
    if (price && prevClose) {
        return {
            ticker: ticker.toUpperCase(),
            price: price,
            volume: volume,
            prevclose: prevClose,
            pointgl: pointgl.toFixed(2),
            percentgl: getPercentGain(prevClose, 1, price),
        };
    } else {
        return false;
    }
};

const getPercentGain = (purchase, shares, price) => {
    const pricePaid = shares * purchase;
    let worth = shares * price;
    worth = (worth - pricePaid) / pricePaid;
    worth = worth * 100;
    worth = worth.toFixed(2);
    return worth;
};

app.get("/:ticker", async (req, res) => {
    const ticker = req.params.ticker;
    const quote = await getQuote(ticker);
    if (quote) {
        res.json({
            ...quote,
        });
    } else {
        res.json({error: "Couldn't find ticker"});
    }
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
