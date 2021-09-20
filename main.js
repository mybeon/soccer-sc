const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
app.use("/static", express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
const dotenv = require("dotenv");
dotenv.config();
const puppeteer = require("puppeteer-extra");
const addBlokcer = require("puppeteer-extra-plugin-adblocker");
const url = process.env.MAIN_URL;
puppeteer.use(addBlokcer());
app.use(cors());

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/player/:name", async (req, res) => {
  const playerServe = req.params.name.replace("_", " ");
  const data = await loadData(playerServe);
  res.json(data);
});

// Puppeteer logic
const puppeteerLaunch = (async () => {
  const launch = await puppeteer.launch({
    headless: true,
    userDataDir: "./cache",
  });

  const wsEndpoint = launch.wsEndpoint();
  return wsEndpoint;
})();

async function loadData(playerName) {
  const endPoint = await puppeteerLaunch;
  const browser = await puppeteer.connect({ browserWSEndpoint: endPoint });
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });

  await page.type(".header-suche", playerName);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  try {
    await Promise.all([
      page.click("tr.odd td.hauptlink a"),
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    ]);
  } catch {
    page.close();
    return {
      errorMessage: "couldn't find the player.",
    };
  }

  const data = await page.evaluate(async () => {
    const main = document.querySelector("#main");
    const highestValue = main
      .querySelector(".zeile-unten .right-td")
      .innerText.split("\n");
    const currentValue = main.querySelector(".zeile-oben .right-td").innerText;
    const positions = main.querySelector(
      "#main > div:nth-child(15) > div.large-8.columns > div:nth-child(2) > div > div.large-6.large-push-6.small-12.columns > div > div.detailpositionen > div > div.large-5.columns.infos.small-12 > div > div.nebenpositionen"
    );

    const injuries = main.querySelector(".verletzungsbox");

    const league = main.querySelector(".dataZusatzbox .mediumpunkt");

    const playerImg = main.querySelector(".modal-trigger img").src;

    const playerName = main.querySelector('h1[itemprop="name"]').innerText;

    const youthClub = main.querySelector('[data-viewport="Jugendvereine"] div');
    const transferDataHTML = main.querySelectorAll(
      ".transferhistorie tbody tr"
    );

    const playerDataHTML = main.querySelectorAll(".spielerdaten tbody tr");

    const imgClub = main.querySelector(".vereinprofil_tooltip img").src;

    let PlayerData = Array.from(playerDataHTML).map((e) =>
      e.innerText.split(":\t")
    );

    if (PlayerData[PlayerData.length - 1][0] == "Social-Media") {
      PlayerData.splice(-1);
    }

    let transferData = [];
    transferDataHTML.forEach((el) => transferData.push(el.innerText));
    transferData = transferData.map((el) =>
      el.split("\t").filter((arr) => arr != "")
    );

    function youthHandle() {
      if (youthClub) {
        return youthClub.innerText.split(",");
      } else {
        return [];
      }
    }

    function filterPositions() {
      if (positions) {
        const arrpos = positions.innerText.split("\n");
        return arrpos.filter((pos) => pos != "Other position:");
      } else {
        return [];
      }
    }

    function leagueHandle() {
      if (league) {
        return league.innerText;
      } else {
        return [];
      }
    }

    function injuriesHandle() {
      if (injuries) {
        return injuries.innerText.split("\n");
      } else {
        return [];
      }
    }
    return {
      player_name: playerName,
      player_info: PlayerData,
      player_img: playerImg,
      club_img: imgClub,
      player_league: leagueHandle(),
      highest_value: highestValue[0],
      highest_value_date: highestValue[1],
      current_value: currentValue,
      other_positions: filterPositions(),
      player_injurie: injuriesHandle(),
      transfer: transferData,
      youth_club: youthHandle(),
    };
  });

  await page.close();
  //await browser.disconnect();
  return data;
}
app.listen(4000, console.log("server started..."));
