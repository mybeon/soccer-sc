const nikeLogo =
  '<a href="https://cdnlogo.com/logo/nike_900.html"><img class="img_outfitter" src="https://cdn.cdnlogo.com/logos/n/67/nike.svg"></a>';
const adidasLogo =
  '<a href="https://cdnlogo.com/logo/adidas_32022.html"><img class="img_outfitter" src="https://cdn.cdnlogo.com/logos/a/83/adidas.svg"></a>';
const pumaLogo =
  '<a href="https://cdnlogo.com/logo/puma_38111.html"><img class="img_outfitter" src="https://cdn.cdnlogo.com/logos/p/40/puma.png"></a>';
const playerDiv = document.querySelector(".player_stats");
const submitBtn = document.querySelector("button[type='submit']");
const form = document.querySelector("form");
const spinner = `<div class="d-flex justify-content-center">
      <div class="spinner-border" role="status">
      <span class="visually-hidden">Loading...</span>
      </div>
      </div>`;

form.addEventListener("submit", (e) => {
  e.preventDefault();
  submitBtn.style.display = "none";
  playerDiv.innerHTML = spinner;
  const playerName = form
    .querySelector("input[type='text']")
    .value.trim()
    .replaceAll(" ", "_");

  fetch(`http://localhost:4000/player/${playerName}`)
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data);
      if (data.errorMessage) {
        playerDiv.innerHTML = "<p>" + data.errorMessage + "</p>";
        submitBtn.style.display = "block";
      } else {
        const checkPosition = data.player_info.map((element) => {
          if (element[0] == "Position") {
            const position = element[1].split(" - ");
            return position;
          }
        });
        const filterPosition = checkPosition.filter((e) => e != undefined);
        const playerPosition =
          filterPosition[0].length > 1
            ? filterPosition[0][1].trim().toLowerCase().replaceAll(" ", "_")
            : filterPosition[0][0].toLowerCase();
        const otherPositions = data.other_positions.map((el) => {
          return `<div class="jersey other_position ${el
            .toLowerCase()
            .replace(" ", "_")}"></div>`;
        });
        console.log(otherPositions);
        const transferTable = `<table class="transfer-table table table-hover">
                                <thead>
                                  <th>season</th>
                                  <th>date</th>
                                  <th>out<img class="out-arrow" src="static/img/out-arrow.svg" ></th>
                                  <th>in<img class="in-arrow" src="static/img/in-arrow.svg" ></th>
                                  <th>MV</th>
                                  <th>fee</th>
                                </thead>
                                <tbody>
                                ${data.transfer
                                  .map((el) => {
                                    return (
                                      "<tr>" +
                                      el
                                        .map((e) => {
                                          return "<td>" + e + "</td>";
                                        })
                                        .join("") +
                                      "</tr>"
                                    );
                                  })
                                  .join("")}
                                </tbody>
                              </table>`;
        playerDiv.insertAdjacentHTML("afterend", transferTable);
        playerDiv.innerHTML = `<div><table class="table table-hover"><tbody>
                    ${data.player_info
                      .map((row) => {
                        return `<tr>
                        <th>${row[0]}</th>
                        <td>${
                          row[0] == "Outfitter"
                            ? `<img class="img_outfitter" src="/static/img/${row[1].replace(
                                " ",
                                ""
                              )}.png" alt="outfitter">`
                            : row[1].trim()
                        }</td></tr>`;
                      })
                      .join("")}</tbody>
                    </table></div>
                    <div class="pitch">
                    <img src="/static/img/pitch.png" alt="" />
                      <div class="jersey ${playerPosition}"></div>
                      ${otherPositions.map((el) => el).join("")}
                    </div>`;
        submitBtn.style.display = "block";
      }
    })
    .catch((e) => {
      console.error(e);
    });
});
