let html = $("html");
const baseUrl = window.location.protocol + "//" + window.location.host + "/";
const isProduction = baseUrl === "https://www.paypal.com/";
let ppLinking = [];
let ppBrokenLink = [];
let ppDataPaClick = [];
let ImageDetails = [];
let ImageStageLinkDetails = [];
let resultArray = [];
const stageLink = "paypalobjects.com";
const windowWidth = $(window).width();
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  var word = request.word;
  if (request.word)
    request.word.map((item) => {
      var context = document.querySelector("body");
      var instance = new Mark(context);
      instance.unmark();
      instance.mark(word, {
        accuracy: "partially",
        separateWordSearch: true,
        caseSensitive: true,
        limiters: ["."],
        done: function (counter) {
          if (counter === 0) {
            chrome.runtime.sendMessage({ noResult: word });
          } else {
            chrome.runtime.sendMessage({ foundWord: word });
          }
        },
      });
    });

  if (request.message === "clicked_browser_action") {
    isActive = true;
    sendResponse(isActive);
    if (isActive && !$("html").hasClass("page-detect")) {
      if ($("#page_info")) {
        $("#page_info").remove();
      }

      html.addClass("page-detect");
      html.append(
        "<div id='page_info'> <div class='wrapper'> <h3 id='img_infohead' class='img_info_title heading'>PP All in One Inspector <span class='img-close'>X</span></h3><ul> <li class='1'>Check pplinking</li><li class='2'>Check Broken links</li><li class='3'>Check data-pa-click</li><li class='4'>Check image sizes</li><li class='5'>Live Image check</li><li class='6'>Check Assets Links</li></ul> <p> Download the full report </p> <button class='btn hidebtn' id='download-btn'> Download</button> </div></div><div id='tableData' class='d-none'></div>"
      );

      document
        .getElementById("download-btn")
        .addEventListener("click", generateFullReport);

      $(".1").addClass("active").text("Checking PPLinking");
      setTimeout(function () {
        checkPPLinking();
      }, 2000);

      $("html, body").animate(
        {
          scrollTop: $(document).height(),
        },
        100
      );
      $("html, body").animate(
        {
          scrollTop: 0,
        },
        100
      );

      // 1. Check pplinking
      function checkPPLinking() {
        const anchors = document.getElementsByTagName("a");
        let isFail = false;
        for (let i = 0; i < anchors.length; i++) {
          let a = anchors[i];
          if (a.hasAttribute("href")) {
            if (
              a.href.indexOf("paypal.com") === -1 &&
              a.href.indexOf("/webapps/mpp") === -1
            ) {
              ppLinking.push({
                url: a.href,
                errorMsg: "Third party Link",
                error: false,
                text: $(a).text(),
                ele: a,
              });

              if (a.href.includes(".pdf") && a.href.indexOf(stageLink) === -1) {
                const isAlreadyExists = resultArray.some(
                  (data) => data.url === a.href
                );
                if (!isAlreadyExists) {
                  resultArray.push({
                    url: a.href,
                    errorMsg: "Media Using Stage link",
                    error: true,
                    text: $(a).text(),
                    ele: a,
                  });
                }
              } else if (a.href.indexOf(stageLink) === -1) {
              } else {
                const isAlreadyExists = resultArray.some(
                  (data) => data.url === a.href
                );
                if (!isAlreadyExists) {
                  resultArray.push({
                    url: a.href,
                    errorMsg: "Media Using Live link",
                    error: false,
                    text: $(a).text(),
                    ele: a,
                  });
                }
              }
            } else if (a.href.indexOf("webapps/mpp") === -1) {
              ppLinking.push({
                url: a.href,
                errorMsg: "No pplinking",
                error: true,
                text: $(a).text(),
                ele: a,
              });
              isFail = true;
            } else if (!isProduction) {
              let linkBaseUrl = a.href.split("/");
              linkBaseUrl = linkBaseUrl[0] + "//" + linkBaseUrl[2] + "/";
              if (
                a.href.indexOf("webapps/mpp") !== -1 &&
                linkBaseUrl !== baseUrl &&
                linkBaseUrl !== "https://msmaster.qa.paypal.com/"
              ) {
                ppLinking.push({
                  url: a.href,
                  errorMsg: "Hardcoded link",
                  error: true,
                  text: $(a).text(),
                  ele: a,
                });
                isFail = true;
              } else {
                ppLinking.push({
                  url: a.href,
                  errorMsg: "pplinking Implemented",
                  error: false,
                  text: $(a).text(),
                  ele: a,
                });
              }
            } else {
              ppLinking.push({
                url: a.href,
                errorMsg: "pplinking Implemented",
                error: false,
                text: $(a).text(),
                ele: a,
              });
            }
          }
        }

        if (isFail) {
          const count =
            '<span class="fail-count">' +
            ppLinking.filter((data) => data.error).length +
            "</span>";
          $(".1")
            .removeClass("active")
            .addClass("complete fail")
            .html(
              'PPLinking check complete <input type="checkbox" class="toggleSwitch" id="ppLink"/> <label for="ppLink" />'
            )
            .append(count);
          document
            .getElementById("ppLink")
            .addEventListener("click", highlightPPLinking);
        } else {
          $(".1")
            .removeClass("active")
            .addClass("complete pass")
            .text("PPLinking check complete");
        }
        checkBrokenLinks();
      }

      // 2. Check borken links
      function checkBrokenLinks() {
        $(".2").addClass("active").text("Checking Broken links");
        const anchors = document.getElementsByTagName("a");
        for (let i = 0; i < anchors.length; i++) {
          const a = anchors[i];
          if (a.hasAttribute("href")) {
            UrlExists(a, i === anchors.length - 1);
          }
        }
      }

      // 3. Check data-pa-click
      function checkDataPaClick() {
        let isFailed = false;
        const allElements = document.body.getElementsByTagName("*");
        for (let i = 0; i < allElements.length; i++) {
          checkPPWord(allElements[i]);
          if (allElements[i].hasAttribute("data-pa-click")) {
            if (
              allElements[i].getAttribute("data-pa-click") === " " ||
              allElements[i].getAttribute("data-pa-click") === "" ||
              allElements[i].getAttribute("data-pa-click") === undefined ||
              allElements[i].getAttribute("data-pa-click") === null
            ) {
              isFailed = true;

              // create array of objects to generate excelsheet
              ppDataPaClick.push({
                tagName: allElements[i].tagName,
                ele: allElements[i],
                dataPa: allElements[i].getAttribute("data-pa-click"),
                errorMsg: "Empty",
                error: true,
                text: $(allElements[i]).text(),
              });
            } else {
              const dataPaClick = allElements[i].getAttribute("data-pa-click");
              if (
                dataPaClick &&
                dataPaClick.includes("link") &&
                dataPaClick.includes("event_name")
              ) {
                const eventObject = JSON.parse(dataPaClick);

                eventObject.link !== "" && eventObject.event_name !== ""
                  ? ppDataPaClick.push({
                    tagName: allElements[i].tagName,
                    ele: allElements[i],
                    dataPa: allElements[i].getAttribute("data-pa-click"),
                    errorMsg: "Valid",
                    error: false,
                    text: $(allElements[i]).text(),
                    dataPaTrim: allElements[i]
                      .getAttribute("data-pa-click")
                      .toLowerCase()
                      .replace(/\s+/g, ""),
                  })
                  : "";
              } else {
                const specialChars = /['"]/;
                ppDataPaClick.push({
                  tagName: allElements[i].tagName,
                  ele: allElements[i],
                  dataPa: allElements[i].getAttribute("data-pa-click"),
                  errorMsg: specialChars.test(
                    allElements[i].getAttribute("data-pa-click")
                  )
                    ? "Invalid(Special characters)"
                    : "Valid",
                  error: specialChars.test(
                    allElements[i].getAttribute("data-pa-click")
                  ),
                  text: $(allElements[i]).text(),
                  dataPaTrim: allElements[i]
                    .getAttribute("data-pa-click")
                    .toLowerCase()
                    .replace(/\s+/g, ""),
                });
              }
            }
          } else if (allElements[i].hasAttribute("data-pa-download")) {
            if (
              allElements[i].getAttribute("data-pa-download") === " " ||
              allElements[i].getAttribute("data-pa-download") === "" ||
              allElements[i].getAttribute("data-pa-download") === undefined ||
              allElements[i].getAttribute("data-pa-download") === null
            ) {
              isFailed = true;

              // create array of objects to generate excelsheet
              ppDataPaClick.push({
                tagName: allElements[i].tagName,
                ele: allElements[i],
                dataPa: allElements[i].getAttribute("data-pa-download"),
                errorMsg: "Empty",
                error: true,
                text: $(allElements[i]).text(),
              });
            } else {
              // create array of objects to generate excelsheet
              const specialChars = /['"]/;
              ppDataPaClick.push({
                tagName: allElements[i].tagName,
                ele: allElements[i],
                dataPa: allElements[i].getAttribute("data-pa-download"),
                errorMsg: specialChars.test(
                  allElements[i].getAttribute("data-pa-download")
                )
                  ? "Invalid(Special characters)"
                  : "Valid",
                error: specialChars.test(
                  allElements[i].getAttribute("data-pa-download")
                ),
                text: $(allElements[i]).text(),
                dataPaTrim: allElements[i]
                  .getAttribute("data-pa-download")
                  .toLowerCase()
                  .replace(/\s+/g, ""),
              });
            }
          } else if (
            (allElements[i].tagName === "A" ||
              allElements[i].tagName === "BUTTON" ||
              (allElements[i].tagName === "INPUT" &&
                ["button", "submit", "reset"].includes(
                  allElements[i].getAttribute("type").toLowerCase()
                ))) &&
            !allElements[i].hasAttribute("data-pa-click")
          ) {
            // create array of objects to generate excelsheet
            ppDataPaClick.push({
              tagName: allElements[i].tagName,
              ele: allElements[i],
              dataPa: allElements[i].getAttribute("data-pa-click"),
              errorMsg: "Not Implemented",
              error: true,
              text: $(allElements[i]).text(),
            });
          }
        }

        checkRepeated();
        if (ppDataPaClick.some((data) => data.error === true)) {
          const count =
            '<span class="fail-count">' +
            ppDataPaClick.filter((data) => data.error).length +
            "</span>";
          $(".3")
            .removeClass("active")
            .addClass("complete fail")
            .html(
              'Data-pa-click check complete <input type="checkbox" class="toggleSwitch" id="dataPaFail" /><label for="dataPaFail" />'
            )
            .append(count);
          document
            .getElementById("dataPaFail")
            .addEventListener("click", highlightPPDataPa);
        } else {
          $(".3")
            .removeClass("active")
            .addClass("complete pass")
            .text("Data-pa-click check complete");
        }

        $(".4").addClass("active").text("Checking image size compliance");
        setTimeout(function () {
          ppcheckImageDetails();
        }, 2000);
      }

      // 4. Check image sizes
      function ppcheckImageDetails() {
        let imageCount = 0;
        $("html, body").animate(
          {
            scrollTop: $(document).height(),
          },
          100
        );
        $("html, body").animate(
          {
            scrollTop: 0,
          },
          100
        );

        $("*:not(footer *)").each(function () {
          // body...
          let element = $(this);

          // Check for foreground image
          if (element.prop("tagName") === "IMG") {
            const imageSrc = element.attr("src");
            if (imageSrc) {
              imageCount = imageCount + 1;
              let ImageObject = new Image();
              ImageObject.src = imageSrc;

              let format = "";
              const dataFormat = new RegExp(/data:image.*;/, "gi");

              if (
                imageSrc.match(/.(svg|jpg|jpeg|png|gif)$/i) ||
                imageSrc.match(/^data:/i)
              ) {
                format = imageSrc.match(/.(svg|jpg|jpeg|png|gif)$/i);
                format = format[1];
              }
              if (imageSrc.match(dataFormat)) {
                format = imageSrc.match(dataFormat);
                format =
                  format && format.length
                    ? format[0].split("/")[1].replace(";", "")
                    : "";
              }

              const dataObj = {
                url: imageSrc,
                alt: element.attr("alt") || "",
                dimension: "",
                fileSize: "",
                format: format,
                sizeExceeded: false,
                width: "",
                error: element.attr("alt") ? false : true,
                ele: element,
              };

              ImageObject.onload = function () {
                const dimension = this.width + " X " + this.height;
                updateImageData(imageSrc, "dimension", dimension);
                updateImageData(imageSrc, "width", this.width);
                checkImageSize(imageSrc, this.width);
              };

              const isAlreadyExists = ImageDetails.some(
                (data) => data.url === imageSrc
              );

              if (!isAlreadyExists) {
                ImageDetails.push(dataObj);
              }
            }
          }

          // Check for background image
          if (element.css("background-image").match(/^(url)/i)) {
            if (element.css("background-image") != "none") {
              let imageSrc = element.css("background-image");
              if (imageSrc) {
                imageCount = imageCount + 1;
                let ImageObject = new Image();
                imageSrc = imageSrc
                  .replace("url(", "")
                  .replace(")", "")
                  .replace(/\"/gi, "");
                ImageObject.src = imageSrc;
                let format = "";
                const dataFormat = new RegExp(/data:image.*;/, "gi");

                if (imageSrc.match(/.(svg|jpg|jpeg|png|gif)$/i)) {
                  format = imageSrc.match(/.(svg|jpg|jpeg|png|gif)$/i);
                  format = format[1];
                }
                if (imageSrc.match(dataFormat)) {
                  format = imageSrc.match(dataFormat);
                  format =
                    format && format.length
                      ? format[0].split("/")[1].replace(";", "")
                      : "";
                }

                const dataObj = {
                  url: imageSrc,
                  alt: "Not Required",
                  dimension: "",
                  fileSize: "",
                  format: format,
                  sizeExceeded: false,
                  width: "",
                  error: false,
                  ele: element,
                };

                ImageObject.onload = function () {
                  const dimension = this.width + " X " + this.height;
                  updateImageData(imageSrc, "dimension", dimension);
                  updateImageData(imageSrc, "width", this.width);
                  checkImageSize(imageSrc, this.width);
                };

                const isAlreadyExists = ImageDetails.some(
                  (data) => data.url === imageSrc
                );

                if (!isAlreadyExists) {
                  ImageDetails.push(dataObj);
                }
              }
            }
          }
          if (ImageDetails.some((data) => data.error === true)) {
            const count =
              '<span class="fail-count">' +
              ImageDetails.filter((data) => data.error).length +
              "</span>";
            $(".4")
              .removeClass("active")
              .addClass("complete fail")
              .html(
                'Image check complete <input type="checkbox" class="toggleSwitch" id="ppFailImage" /> <label for="ppFailImage" />'
              )
              .append(count);
            document
              .getElementById("ppFailImage")
              .addEventListener("click", highlightPPImage);
          } else {
            $(".4")
              .removeClass("active")
              .addClass("complete pass")
              .text("Image check complete");
          }

          $(".5").addClass("active").text("Checking image compliance");
          setTimeout(function () {
            ppcheckImageStageLinkDetails();
          }, 2000);
        });
      }

      function ppcheckImageStageLinkDetails() {
        let imageCount = 0;
        $("*:not(footer *)").each(function () {
          // body...
          let element = $(this);

          // Check for foreground image
          if (element.prop("tagName") === "IMG") {
            const imageSrc = element.attr("src");
            if (imageSrc) {
              imageCount = imageCount + 1;
              let ImageObject = new Image();
              ImageObject.src = imageSrc;

              let format = "";
              const dataFormat = new RegExp(/data:image.*;/, "gi");

              if (
                imageSrc.match(/.(svg|jpg|jpeg|png|gif)$/i) ||
                imageSrc.match(/^data:/i)
              ) {
                format = imageSrc.match(/.(svg|jpg|jpeg|png|gif)$/i);
                format = format[1];
              }
              if (imageSrc.match(dataFormat)) {
                format = imageSrc.match(dataFormat);
                format =
                  format && format.length
                    ? format[0].split("/")[1].replace(";", "")
                    : "";
              }

              const dataObj = {
                url: imageSrc,
                alt: element.attr("alt") || "",
                error: imageSrc.includes(stageLink) ? false : true,
                ele: element,
                errorMsg: imageSrc.includes(stageLink)
                  ? "Live url"
                  : "Stage Url",
              };

              const isAlreadyExists = ImageStageLinkDetails.some(
                (data) => data.url === imageSrc
              );

              if (!isAlreadyExists) {
                ImageStageLinkDetails.push(dataObj);
              }
            }
          }

          // Check for background image
          if (element.css("background-image").match(/^(url)/i)) {
            if (element.css("background-image") != "none") {
              let imageSrc = element.css("background-image");
              if (imageSrc) {
                imageCount = imageCount + 1;
                let ImageObject = new Image();
                imageSrc = imageSrc
                  .replace("url(", "")
                  .replace("&quot;", "")
                  .replace(")", "")
                  .replace(/\"/gi, "");
                if (imageSrc == "") {
                } else {
                  let format = "";

                  const dataFormat = new RegExp(/data:image.*;/, "gi");

                  if (imageSrc.match(/.(svg|jpg|jpeg|png|gif)$/i)) {
                    format = imageSrc.match(/.(svg|jpg|jpeg|png|gif)$/i);
                    format = format[1];
                  }

                  if (imageSrc.match(dataFormat)) {
                    format = imageSrc.match(dataFormat);
                    format =
                      format && format.length
                        ? format[0].split("/")[1].replace(";", "")
                        : "";
                  }

                  const dataObj = {
                    url: imageSrc,
                    alt: "Background Image",
                    error: imageSrc.includes(stageLink) ? false : true,
                    ele: element,
                    errorMsg: imageSrc.includes(stageLink)
                      ? "Live url"
                      : "Stage url",
                  };

                  const isAlreadyExists = ImageStageLinkDetails.some(
                    (data) => data.url === imageSrc
                  );

                  if (!isAlreadyExists) {
                    ImageStageLinkDetails.push(dataObj);
                  }
                }
              }
            }
          }
        });

        if (ImageStageLinkDetails.some((data) => data.error === true)) {
          const count =
            '<span class="fail-count">' +
            ImageStageLinkDetails.filter((data) => data.error).length +
            "</span>";
          $(".5")
            .removeClass("active")
            .addClass("complete fail")
            .html(
              'Image live link check complete <input type="checkbox" class="toggleSwitch" id="ppFailStageImage" /> <label for="ppFailStageImage" />'
            )
            .append(count);
          document
            .getElementById("ppFailStageImage")
            .addEventListener("click", highlightStagePPImage);
        } else {
          $(".5")
            .removeClass("active")
            .addClass("complete pass")
            .text("Image live link check complete");
        }
        $(".6").addClass("active").text("Checking Media compliance");
        setTimeout(function () {
          checkMediaDetails();
        }, 2000);
      }

      function checkMediaDetails() {
        const pageSource = document.documentElement.outerHTML;
        const parser = new DOMParser();
        const doc = parser.parseFromString(pageSource, "text/html");
        const elementsWithDataVideoId = doc.querySelectorAll("[data-video-id]");
        if (elementsWithDataVideoId.length > 0) {
          assetCheck(elementsWithDataVideoId, stageLink, resultArray);
          console.log(
            assetCheck(elementsWithDataVideoId, stageLink, resultArray)
          );
        } else {
          resultArray.push({
            url: "",
            errorMsg: "",
            error: false, // Assuming checkYouTubeLink is defined
            text: "",
            ele: "",
          });
        }

        const hasErrors = resultArray.some((data) => data.error);
        const failCount = hasErrors
          ? resultArray.filter((data) => data.error).length
          : 0;

        const $step6 = $(".6");
        $step6.removeClass("active").addClass("complete");

        if (hasErrors) {
          $step6
            .addClass("fail")
            .html(
              `Assets check complete <input type="checkbox" class="toggleSwitch" id="assetsCheck" /> <label for="assetsCheck" /></span>`
            )
            .append(`<span class="fail-count">${failCount}</span>`);
          document
            .getElementById("assetsCheck")
            .addEventListener("click", highStageLinking);
        } else {
          $step6.addClass("pass").text("Assets check complete");
        }

        $(".btn").addClass("showbtn").remove("hidebtn");
      }

      // 5. Generate full report
      function generateFullReport() {
        // use only error objects
        const modifiedPpLinking = sortByTrue(ppLinking).map((data) => ({
          Url: data.url,
          Text: data.text,
          Validation: data.errorMsg,
        }));
        const modifiedPpBrokenLink = sortByTrue(ppBrokenLink).map((data) => ({
          Url: data.url,
          Text: data.text,
          Validation: data.errorMsg,
        }));
        const modifiedPpDataPaClick = sortByTrue(ppDataPaClick).map((data) => ({
          "Tag Name": data.tagName,
          Text: data.text,
          "Data-Pa-Click": data.dataPa,
          Validation: data.errorMsg,
        }));
        const modifiedPpImageDetails = sortByTrue(ImageDetails).map((data) => ({
          Url: data.url,
          "Alt Text": data.alt,
          Dimension: data.dimension,
          Size: data.fileSize,
          Format: data.format,
          Error:
            !data.alt && data.sizeExceeded
              ? "Alt missing & size exceeded"
              : !data.alt
                ? "Alt Missing"
                : data.sizeExceeded
                  ? "Size exceeded"
                  : "",
        }));

        const modifiedPpStageImageDetails = sortByTrue(
          ImageStageLinkDetails
        ).map((data) => ({
          Url: data.url,
          "Alt Text": data.alt,
          Environment: data.url.includes(stageLink) ? "Live Url" : "Stage url",
        }));

        const modifiedPpMediaDetails = sortByTrue(resultArray).map((data) => ({
          Url: data.url,
          Text: data.text,
          Validation: data.errorMsg,
        }));

        const pageName = window.location.href.split("/")[6];
        const fileName =
          "report-" + pageName + new Date().toUTCString() + ".xlsx";
        const opts = [
          {
            sheetid: "PP Linking",
            header: true,
          },
          {
            sheetid: "PP Broken Links",
            header: true,
          },
          {
            sheetid: "PP data-pa-click",
            header: true,
          },
          {
            sheetid: "PP Image Details",
            header: true,
          },
          {
            sheetid: "PP Image Live Links Details",
            header: true,
          },
          {
            sheetid: "PP Media Details",
            header: true,
          },
        ];

        alasql('SELECT INTO XLSX("' + fileName + '",?) FROM ?', [
          opts,
          [
            modifiedPpLinking,
            modifiedPpBrokenLink,
            modifiedPpDataPaClick,
            modifiedPpImageDetails,
            modifiedPpStageImageDetails,
            modifiedPpMediaDetails,
          ],
        ]);

        generatePdf();
      }

      // Others

      // Where el is the DOM element you'd like to test for visibility
      function isHidden(el) {
        return el.offsetParent === null;
      }

      // sort array
      function sortByTrue(array) {
        return array.sort((x, y) =>
          x.error === y.error ? 0 : x.error ? -1 : 1
        );
      }

      function getErrorsData(errorData, checkError) {
        // Handle empty errorData explicitly
        if (!errorData || errorData.length === 0) {
          return []; // Return an empty array
        }

        return errorData.filter((data) => {
          // Prioritize errorMsg if it exists
          if (data.errorMsg && data.errorMsg.includes(checkError)) {
            return true;
          }

          // Check other properties as before
          if (Array.isArray(checkError)) {
            return checkError.some((error) => data.errorMsg.includes(error));
          } else {
            return data.Validation.includes(checkError);
          }
        });
      }

      function createTable(tableId, headings, tableData) {
        const head = `<table id='table${tableId}'><thead id='headings'>`;
        const headClose = "</tr></thead>";
        let hData = "";
        headings.map((cValue) => {
          hData += `
              <th> 
              ${cValue}
              </th>`;
        });

        const body = `<tbody>`;
        const bodyclose = "</tbody></table>";
        let bData = "";
        tableData.map((bValue, index) => {
          bData += `
              <tr>
              <td>${Number(index + Number(1))}</td>
              <td> 
              ${bValue.Url}
              </td>
              <td> 
              ${bValue.Text}
              </td>
              <td> 
              ${bValue.Validation ? bValue.Validation : bValue.errorMsg}
              </td>
              </tr>`;
        });

        return head + hData + headClose + body + bData + bodyclose;
      }

      function modifyDataAndSort(
        data,
        urlProp = "url",
        textProp = "text",
        validationProp = "errorMsg"
      ) {
        // Sort by validationProp and errorMsg in descending order
        data.sort((a, b) => {
          const aValidation = (b[validationProp] || "").localeCompare(
            a[validationProp] || "" || a.errorMsg || ""
          );
          const bValidation = (a[validationProp] || "").localeCompare(
            b[validationProp] || "" || b.errorMsg || ""
          );
          return aValidation !== 0 ? aValidation : bValidation;
        });

        return data.map((item) => ({
          Url: item[urlProp],
          Text: item[textProp],
          Validation: item[validationProp] ? item[validationProp] : "",
          errorMsg:
            !item.alt && item.sizeExceeded
              ? "Alt missing & size exceeded"
              : !item.alt
                ? "Alt Missing"
                : item.sizeExceeded
                  ? "Size exceeded"
                  : "",
        }));
      }

      function generatePdf() {
        const modifiedPpLinking = modifyDataAndSort(
          ppLinking,
          "url",
          "text",
          "errorMsg"
        );
        const modifiedPpBrokenLink = modifyDataAndSort(
          ppBrokenLink,
          "url",
          "text",
          "errorMsg"
        );
        const modifiedPpDataPaClick = modifyDataAndSort(
          ppDataPaClick,
          "tagName",
          "text",
          "errorMsg"
        );
        const modifiedPpImageDetails = modifyDataAndSort(
          ImageDetails,
          "url",
          "alt",
          ""
        );
        const modifiedPpStageImageDetails = modifyDataAndSort(
          ImageStageLinkDetails,
          "url",
          "alt",
          "errorMsg"
        );
        const modifiedMedia = modifyDataAndSort(
          resultArray,
          "url",
          "text",
          "errorMsg"
        );
        const ppLinkError = getErrorsData(modifiedPpLinking, "No pplinking");
        const dataPaError = getErrorsData(
          modifiedPpDataPaClick,
          "Not Implemented",
        );
        const brokenLinkError = getErrorsData(
          modifiedPpBrokenLink,
          "Broken Link"
        );
        const imageError = getErrorsData(modifiedPpImageDetails, [
          "Alt missing & size exceeded",
          "Size exceeded",
          "Alt Missing",
        ]);
        const liveImageError = getErrorsData(
          modifiedPpStageImageDetails,
          "Stage url"
        );
        const mediaError = getErrorsData(
          modifiedMedia,
          "Media Using Stage link"
        );
        const { jsPDF } = window.jspdf;

        const doc = new jsPDF();
        if (ppLinkError.length > 0) {
          doc.text("PP Link report", 13, 20);
          var y = 30;
          const bodydpp = createTable(
            "pplink",
            ["Sr No", "Url", "Text", "Error"],
            ppLinkError
          );
          $("#tableData").append(bodydpp);

          doc.setLineWidth(2);
          doc.autoTable({
            html: "#tablepplink",
            startY: y,
            theme: "grid",
            showHeader: "firstPage",
          });
        }

        if (dataPaError.length > 0) {
          yPos = doc.lastAutoTable.finalY + 30;
          doc.text("Data Pa Click", 13, doc.lastAutoTable.finalY + 20);

          const bodydpa = createTable(
            "datapa",
            ["Sr No", "Tag Name", "Text", "Error"],
            dataPaError
          );
          $("#tableData").append(bodydpa);
          doc.setLineWidth(2);

          doc.autoTable({
            html: "#tabledatapa",
            startY: yPos,
            theme: "grid",
            showHeader: "firstPage",
          });
        }

        if (brokenLinkError.length > 0) {
          yPos = doc.lastAutoTable.finalY + 30;
          doc.text("Broken Link Report", 13, doc.lastAutoTable.finalY + 20);

          const bodydpa = createTable(
            "brokenlink",
            ["Sr No", "Url", "Text", "Error"],
            brokenLinkError
          );
          $("#tableData").append(bodydpa);
          doc.setLineWidth(2);
          doc.autoTable({
            html: "#tablebrokenlink",
            startY: yPos,
            theme: "grid",
            showHeader: "firstPage",
          });
        }

        if (imageError.length > 0) {
          yPos = doc.lastAutoTable.finalY + 30;
          doc.text("Image Error Report", 13, doc.lastAutoTable.finalY + 20);

          const bodydpa = createTable(
            "imageerror",
            ["Sr No", "Url", "Alt Text", "Error"],
            imageError
          );
          $("#tableData").append(bodydpa);
          doc.setLineWidth(2);

          doc.autoTable({
            html: "#tableimageerror",
            startY: yPos,
            theme: "grid",
            showHeader: "firstPage",
          });
        }

        if (liveImageError.length > 0) {
          yPos = doc.lastAutoTable.finalY + 30;
          doc.text("Live Image Url Report", 13, doc.lastAutoTable.finalY + 20);

          const bodydpa = createTable(
            "liveimageerror",
            ["Sr No", "Url", "Alt Text", "Error"],
            liveImageError
          );
          $("#tableData").append(bodydpa);
          doc.setLineWidth(2);

          doc.autoTable({
            html: "#tableliveimageerror",
            startY: yPos,
            theme: "grid",
            showHeader: "firstPage",
          });
        }

        if (mediaError.length > 0) {
          yPos = doc.lastAutoTable.finalY + 30;
          doc.text("Asset Report", 13, doc.lastAutoTable.finalY + 20);

          const bodydpa = createTable(
            "mediaerror",
            ["Sr No", "Url", "Text", "Error"],
            mediaError
          );
          $("#tableData").append(bodydpa);
          doc.setLineWidth(2);

          doc.autoTable({
            html: "#tablemediaerror",
            startY: yPos,
            theme: "grid",
            showHeader: "firstPage",
          });
        }

        const pageName = window.location.href.split("/")[6];
        const fileName =
          "report-" + pageName + new Date().toUTCString() + ".pdf";
        doc.save(fileName);
      }

      // ** check if url exists
      function UrlExists(b, last) {
        $.ajax({
          url: b.href,
          success: function (response) {
            ppBrokenLink.push({
              url: b.href,
              text: $(b).text(),
              errorMsg: b.getAttribute("href") !== "#" ? "Valid" : "Hash Value",
              error: b.getAttribute("href") === "#",
              ele: b,
            });

            if (last) {
              setTimeout(function () {
                if (ppBrokenLink.some((data) => data.error)) {
                  const count =
                    '<span class="fail-count">' +
                    ppBrokenLink.filter((data) => data.error).length +
                    "</span>";
                  $(".2")
                    .removeClass("active")
                    .addClass("complete fail")
                    .html(
                      'Broken link check complete <input type="checkbox" class="toggleSwitch" id="ppBrokenFail" /> <label for="ppBrokenFail" />'
                    )
                    .append(count);
                  document
                    .getElementById("ppBrokenFail")
                    .addEventListener("click", highlightPPBroken);
                } else {
                  $(".2")
                    .removeClass("active")
                    .addClass("complete pass")
                    .text("Broken link check complete");
                }
                $(".3")
                  .addClass("active")
                  .text("Checking data-pa-click implementation");
                checkDataPaClick();
              }, 2000);
            }
          },
          error: function (err) {
            if (err.status === 404) {
              ppBrokenLink.push({
                url: b.href,
                text: $(b).text(),
                errorMsg: "Broken Link",
                error: true,
                ele: b,
              });
            }
            if (b.href.indexOf("https://") === -1 || err.status === 0) {
              ppBrokenLink.push({
                url: b.href,
                text: $(b).text(),
                errorMsg: "Check manually",
                error: false,
                ele: b,
              });
            }

            if (last) {
              setTimeout(function () {
                if (ppBrokenLink.some((data) => data.error)) {
                  const count =
                    '<span class="fail-count">' +
                    ppBrokenLink.filter((data) => data.error).length +
                    "</span>";
                  $(".2")
                    .removeClass("active")
                    .addClass("complete fail")
                    .html(
                      'Check broken link completed <input type="checkbox" class="toggleSwitch" id="ppBrokenFail"  /> <label for="ppBrokenFail" />'
                    )
                    .append(count);
                  document
                    .getElementById("ppBrokenFail")
                    .addEventListener("click", highlightPPBroken);
                } else {
                  $(".2")
                    .removeClass("active")
                    .addClass("complete pass")
                    .text("Checking broken link completed");
                }

                $(".3")
                  .addClass("active")
                  .text("Checking data-pa-click implementation");
                checkDataPaClick();
              }, 2000);
            }
          },
        });
      }

      // ** check repeatation
      function checkRepeated() {
        let validDataPa = ppDataPaClick.filter(
          (data) => data.errorMsg === "Valid"
        );
        if (validDataPa && validDataPa.length) {
          for (let i = 0; i <= validDataPa.length; i++) {
            for (let j = i; j <= validDataPa.length; j++) {
              if (
                i != j &&
                validDataPa[i] &&
                validDataPa[j] &&
                validDataPa[i].dataPaTrim === validDataPa[j].dataPaTrim
              ) {
                validDataPa[i].errorMsg = isHidden(validDataPa[i].ele)
                  ? "For Mobile"
                  : "Duplicate";
                validDataPa[j].errorMsg =
                  isHidden(validDataPa[i].ele) && !isHidden(validDataPa[j].ele)
                    ? "Valid"
                    : "Duplicate";
                validDataPa[i].error = !isHidden(validDataPa[i].ele);
                validDataPa[j].error = !isHidden(validDataPa[i].ele);
              }
            }
          }
        }
      }

      /*************** Check image size and update object **************/
      function checkImageSize(imageSrc, width) {
        var req = new XMLHttpRequest();
        req.open("GET", imageSrc, !0);
        req.responseType = "blob";

        req.onload = function () {
          blob = req.response;
          let fileSize = convertBytes(blob.size);

          updateImageData(imageSrc, "fileSize", fileSize);

          let size_check = 0;
          if (fileSize && !fileSize.includes("Bytes")) {
            size_check = Number(
              fileSize
                .replace(" GB", "")
                .replace(" MB", "")
                .replace(" Bytes", "")
                .replace(" KB", "")
            ).toFixed(2);
          }

          if (size_check >= 25.0 && width < 250) {
            exceededStatements(imageSrc);
          } else if (size_check >= 50.0 && width > 0 && windowWidth <= 767) {
            exceededStatements(imageSrc);
          } else if (size_check >= 125.0 && width < 1600 && width > 0) {
            exceededStatements(imageSrc);
          } else if (size_check >= 150.0 && width >= 1600) {
            exceededStatements(imageSrc);
          } else if (size_check > 1048.576 && width >= 1600) {
            exceededStatements(imageSrc);
          }

          if (ImageDetails.some((data) => data.error === true)) {
            const count =
              '<span class="fail-count">' +
              ImageDetails.filter((data) => data.error).length +
              "</span>";
            $(".4")
              .removeClass("active")
              .addClass("complete fail")
              .html(
                'Image check complete <input type="checkbox" class="toggleSwitch" id="ppFailImage" /> <label for="ppFailImage" />'
              )
              .append(count);
            document
              .getElementById("ppFailImage")
              .addEventListener("click", highlightPPImage);
          } else {
            $(".4")
              .removeClass("active")
              .addClass("complete pass")
              .text("Image check complete");
          }
        };
        req.send();
      }

      /********Update ImageDetails Object**********/
      function updateImageData(url, key, value) {
        const existing = ImageDetails.find((data) => data.url === url) || {};

        if (Object.keys(existing).length) {
          existing[key] = value;
          ImageDetails.forEach((data) => {
            if (data.url === url) {
              return Object.assign(existing, data);
            }
            return data;
          });
        }
      }

      /***************Size exceeding function*******************/
      function exceededStatements(imageSrc) {
        updateImageData(imageSrc, "sizeExceeded", true);
        updateImageData(imageSrc, "error", true);
      }

      /************Image file size get function**************/
      function convertBytes(bytes) {
        if (bytes) {
          if (bytes < 1024) {
            return bytes + " Bytes";
          } else if (bytes < 1048576) {
            return (bytes / 1024).toFixed(2) + " KB";
          } else if (bytes < 1073741824) {
            return (bytes / 1048576).toFixed(2) + " MB";
          } else {
            return (bytes / 1073741824).toFixed(2) + " GB";
          }
        }
        return 0;
      }
    } else {
      close();
    }
  }

  /* highlight elements with error*/

  function highlightPPImage(e) {
    if (e.target.checked) {
      ImageDetails.forEach((data) => {
        if (data.error) {
          $(data.ele).addClass("error-pp-link");
        }
      });
    } else {
      ImageDetails.forEach((data) => {
        if (data.error) {
          $(data.ele).removeClass("error-pp-link");
        }
      });
    }
  }

  function highlightPPBroken(e) {
    if (e.target.checked) {
      ppBrokenLink.forEach((data) => {
        if (data.error) {
          data.ele.classList.add("error-pp-link");
        }
      });
    } else {
      ppBrokenLink.forEach((data) => {
        if (data.error) {
          data.ele.classList.remove("error-pp-link");
        }
      });
    }
  }

  function highlightPPDataPa(e) {
    if (e.target.checked) {
      ppDataPaClick.forEach((data) => {
        if (data.error) {
          data.ele.classList.add("error-pp-link");
        }
      });
    } else {
      ppDataPaClick.forEach((data) => {
        if (data.error) {
          data.ele.classList.remove("error-pp-link");
        }
      });
    }
  }

  function highlightPPLinking(e) {
    if (e.target.checked) {
      ppLinking.forEach((data) => {
        if (data.error) {
          data.ele.classList.add("error-pp-link");
        }
      });
    } else {
      ppLinking.forEach((data) => {
        if (data.error) {
          data.ele.classList.remove("error-pp-link");
        }
      });
    }
  }

  function highStageLinking(e) {
    if (e.target.checked) {
      resultArray.forEach((data) => {
        if (data.error) {
          data.ele.classList.add("error-pp-link");
        }
      });
    } else {
      resultArray.forEach((data) => {
        if (data.error) {
          data.ele.classList.remove("error-pp-link");
        }
      });
    }
  }

  function highlightStagePPImage(e) {
    if (e.target.checked) {
      ImageStageLinkDetails.forEach((data) => {
        if (data.error) {
          $(data.ele).addClass("error-pp-link");
        }
      });
    } else {
      ImageStageLinkDetails.forEach((data) => {
        if (data.error) {
          $(data.ele).removeClass("error-pp-link");
        }
      });
    }
  }

  function findObjectsWithDataObjectId(contentObj) {
    const result = {};

    for (const key in contentObj) {
      if (
        contentObj.hasOwnProperty(key) &&
        contentObj[key].hasOwnProperty("data-object-id")
      ) {
        result[key] = contentObj[key];
      }
    }

    return result;
  }

  // check for Paypal word mistake
  function checkPPWord(element) {
    if (
      element.children.length === 0 &&
      !element.classList.contains("highlight-words") &&
      element.tagName !== "SCRIPT" &&
      element.tagName !== "NOSCRIPT"
    ) {
      const text = element.innerText;

      if (text && text.includes("Paypal")) {
        element.innerHTML = text.replace(
          /Paypal/g,
          '<span class="highlight-words">Paypal</span>'
        );
      }
    }
  }

  function assetCheck(elementsWithDataVideoId, stageLink, resultArray) {
    if (!elementsWithDataVideoId) return;

    elementsWithDataVideoId.forEach((element) => {
      const yturl = element.dataset.videoId;
      if (!yturl) return;

      const isLiveLink = yturl.includes(stageLink);

      const existingData = resultArray.find(
        (data) =>
          data.url ===
          (isLiveLink ? yturl : `https://www.youtube.com/embed/${yturl}`)
      );
      if (!existingData) {
        resultArray.push({
          url: isLiveLink ? yturl : `https://www.youtube.com/embed/${yturl}`,
          errorMsg: isLiveLink ? "Media using live link" : "YouTube link",
          error: !isLiveLink && !checkYouTubeLink(yturl), // Assuming checkYouTubeLink is defined
          text: "Data-video-id",
          ele: element,
        });
      }
    });
  }

  async function checkYouTubeLink(yturl) {
    try {
      const response = await fetch(`https://www.youtube.com/embed/${yturl}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  function close() {
    $("#page_info").remove();
    $("html").removeClass("page-detect");
    $("html *").removeClass("error-pp-link");
    // ppLinking = [];
    ppBrokenLink = [];
    ppDataPaClick = [];
    ImageDetails = [];
    ImageStageLinkDetails = [];
    resultArray = [];
  }

  $(".page-detect #page_info .img-close").click(function () {
    close();
  });
});
