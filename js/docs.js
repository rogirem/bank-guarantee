const Docs = (() => {
  function downloadDoc(html, filename) {
    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** Склонение слова "миллион" */
  function millionDeclension(n) {
    const lastTwo = n % 100;
    const lastOne = n % 10;
    if (lastTwo >= 11 && lastTwo <= 19) return "миллионов";
    if (lastOne === 1) return "миллион";
    if (lastOne >= 2 && lastOne <= 4) return "миллиона";
    return "миллионов";
  }
  /** Склонение слова "тысяча" */
  function thousandDeclension(n) {
    const lastTwo = n % 100;
    const lastOne = n % 10;
    if (lastTwo >= 11 && lastTwo <= 19) return "тысяч";
    if (lastOne === 1) return "тысяча";
    if (lastOne >= 2 && lastOne <= 4) return "тысячи";
    return "тысяч";
  }

  function numToWords(num) {
    const ones = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
    const onesFem = ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
    const tens = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
    const teens = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
    const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];
    
    let rubles = Math.floor(Number(num)) || 0;
    let kopecks = Math.round((Number(num) - rubles) * 100);
    
    if (rubles === 0) return "ноль рублей 00 копеек";
    
    function convertHundreds(n, useFem) {
      if (n === 0) return "";
      let res = "";
      const arr = useFem ? onesFem : ones;
      if (n >= 100) {
        res += hundreds[Math.floor(n / 100)] + " ";
        n %= 100;
      }
      if (n >= 20) {
        res += tens[Math.floor(n / 10)] + " ";
        n %= 10;
      } else if (n >= 10) {
        res += teens[n - 10] + " ";
        n = 0;
      }
      if (n > 0) res += arr[n] + " ";
      return res.trim();
    }
    
    let result = "";
    const millions = Math.floor(rubles / 1000000);
    const thousandsPart = Math.floor((rubles % 1000000) / 1000);
    const remainder = rubles % 1000;
    
    if (millions > 0) {
      const millWords = convertHundreds(millions, false);
      result += (millWords ? millWords + " " : "") + millionDeclension(millions) + " ";
    }
    if (thousandsPart > 0) {
      const thWords = convertHundreds(thousandsPart, true);
      result += (thWords ? thWords + " " : "") + thousandDeclension(thousandsPart) + " ";
    }
    if (remainder > 0) {
      result += convertHundreds(remainder, false) + " ";
    }
    
    const lastDigit = rubles % 10;
    const lastTwoDigits = rubles % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      result += "рублей";
    } else if (lastDigit === 1) {
      result += "рубль";
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      result += "рубля";
    } else {
      result += "рублей";
    }
    
    if (kopecks > 0) {
      result += " " + String(kopecks).padStart(2, "0") + " копеек";
    } else {
      result += " 00 копеек";
    }
    
    return result.trim();
  }

  /** Заявление-анкета на предоставление банковской гарантии (по образцу пользователя). */
  function guaranteeTemplate({ app, client, manager }) {
    const now = new Date();
    const docDate = now.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
    const appDate = app.timestamp ? new Date(app.timestamp) : now;
    const endDate = new Date(appDate);
    endDate.setDate(endDate.getDate() + (app.termDays || 0));
    const endDateStr = endDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
    const amountFormatted = Number(app.amount).toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const principalName = (client && client.name) ? String(client.name).trim() : "—";
    const principalInn = (client && client.inn) ? String(client.inn).trim() : "__________";
    const isIP = principalName.toUpperCase().startsWith("ИП ");
    const contactPersonFio = isIP ? principalName.replace(/^ИП\s+/i, "").trim() : "__________";
    const contactLine = (client && client.contact) ? String(client.contact).trim() : "";
    const contactPerson = contactLine ? `${contactPersonFio}, ${contactLine}` : contactPersonFio;
    const legalAddress = "__________";
    const actualAddress = "__________";
    const guaranteeTypeLabel = app.guaranteeTypeName || "—";
    const beneficiary = (app.beneficiary && String(app.beneficiary).trim()) ? String(app.beneficiary).trim() : "__________";

    return `
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: "Times New Roman", serif; font-size: 11pt; margin:0; padding:0; line-height: 1.35; }
  .page { width: 180mm; margin: 0 auto; }
  .doc-title { text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 12pt; }
  .section-title { font-weight: bold; margin: 10pt 0 4pt 0; }
  .field { margin: 3pt 0; }
  .underline { border-bottom: 1pt solid #000; display: inline-block; min-width: 80px; }
  table.doc-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin: 6pt 0; }
  table.doc-table td, table.doc-table th { border: 1pt solid #000; padding: 3pt 5pt; vertical-align: top; }
  .small { font-size: 9pt; color: #333; }
</style>
</head>
<body>
<div class="page">
  <div class="doc-title">Заявление-анкета в Банк на предоставление банковской гарантии</div>

  <div class="doc-title" style="font-size: 14pt; margin-top: 8pt;">ЗАЯВЛЕНИЕ НА ПРЕДОСТАВЛЕНИЕ БАНКОВСКОЙ ГАРАНТИИ</div>

  <div class="section-title">1. Общие сведения о принципале</div>
  <div class="field">1.1. Полное наименование / Сокращенное наименование: <span class="underline">${principalName}</span></div>
  <div class="field">1.2. Основной государственный регистрационный номер (ОГРН): <span class="underline"></span></div>
  <div class="field">1.3. ИНН: <span class="underline">${principalInn}</span></div>
  <div class="field">1.4. Адрес местонахождения (юридический адрес): <span class="underline">${legalAddress}</span></div>
  <div class="field">1.5. Адрес фактического местонахождения: <span class="underline">${actualAddress}</span></div>
  <div class="field">1.6. Контактное лицо (ФИО, тел., e-mail): <span class="underline">${contactPerson}</span></div>
  <div class="field">1.7. Виды деятельности (ОКВЭД): <span class="underline"></span></div>
  <div class="field">1.8. Имеются ли разрешения/допуски/лицензии на виды работ/услуг по контракту: Да &nbsp;&nbsp; Нет</div>

  <div class="section-title">2. Параметры банковской гарантии</div>
  <div class="field">2.1. Сумма банковской гарантии, рублей: <span class="underline">${amountFormatted}</span></div>
  <div class="field">2.2. Вид банковской гарантии (на обеспечение): Заявки на участие в конкурсе &nbsp; Исполнение обязательств по контракту &nbsp; Возврат аванса &nbsp; Гарантийных обязательств</div>
  <div class="field" style="margin-top: 4pt;">Указанный вид: <span class="underline">${guaranteeTypeLabel}</span></div>
  <div class="field">2.3. Срок действия банковской гарантии: с даты выдачи по «${endDateStr}» г. включительно</div>
  <div class="field">2.4. ФИО/Наименование поручителей (при наличии): <span class="underline"></span></div>

  <div class="section-title">3. Описание договора, по которому запрашивается банковская гарантия</div>
  <div class="field">3.1. Заказчик по контракту (бенефициар): <span class="underline">${beneficiary}</span></div>
  <div class="field">3.2. Предмет контракта: <span class="underline"></span></div>
  <div class="field">3.3. Реестровый номер закупки: <span class="underline"></span></div>
  <div class="field">3.4. Наличие аванса в контракте: Да &nbsp;&nbsp; Нет</div>

  <div class="section-title">4. Обязательства Принципала</div>
  <div class="field">4.1. Действующие кредиты/открытые кредитные линии: <span class="underline"></span></div>
  <div class="field">4.2. Информация о действующих займах: <span class="underline"></span></div>
  <div class="field">4.3. Наличие задолженности по состоянию на текущую дату: <span class="underline"></span></div>

  <div class="section-title">5. Наличие неликвидных запасов и/или требований, безнадежных к взысканию</div>
  <div class="field">Да &nbsp;&nbsp; Нет</div>

  <div class="section-title">6. Сведения о судебных разбирательствах</div>
  <div class="field">Возбуждалась ли в отношении Принципала процедура банкротства? Да &nbsp;&nbsp; Нет</div>
  <div class="field">Имели ли место случаи неисполнения обязательств перед Банком? Да &nbsp;&nbsp; Нет</div>
  <div class="field">Существуют ли судебные дела по искам к Принципалу? Да &nbsp;&nbsp; Нет</div>

  <div class="section-title">7. Сведения о наличии просроченной задолженности перед персоналом</div>
  <div class="field">Имеется ли просроченная задолженность по заработной плате? Да &nbsp;&nbsp; Нет</div>

  <div class="section-title">8. Перечень кредитных организаций, в которых открыты счета</div>
  <div class="field"><span class="underline"></span></div>

  <p style="margin-top: 12pt;">Настоящим подтверждаем, что приведенная в данной анкете информация достоверна и актуальна. С условиями и порядком предоставления Банком банковских гарантий ознакомлен.</p>
  <p>«${docDate.split(".")[0]}» ${docDate.split(".")[1]} ${docDate.split(".")[2]} г.</p>
  <p class="small">Руководитель Принципала __________________ _________________</p>
  <p class="small">Подпись &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ФИО</p>
  <p class="small">М.П.</p>
</div>
</body></html>`;
  }

  /** Договор о банковской гарантии на обеспечение исполнения обязательств (по образцу пользователя). */
  function contractTemplate({ app, client, manager }) {
    const now = new Date();
    const docDate = now.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
    const appDate = app.timestamp ? new Date(app.timestamp) : now;
    const date = appDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
    const contractNumber = String((app.id || "").replace("APP-", "")).padStart(3, "0");
    const guaranteeNumber = contractNumber;
    const amountNum = Number(app.amount) || 0;
    const amountWords = numToWords(amountNum);
    const amountFormatted = amountNum.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false }).replace(",", ".");
    const endDate = new Date(appDate);
    endDate.setDate(endDate.getDate() + (app.termDays || 0));
    const endDateStr = endDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
    const endYear = endDate.getFullYear();
    const principalName = (client && client.name) ? String(client.name).trim() : "—";
    const beneficiary = (app.beneficiary && String(app.beneficiary).trim()) ? String(app.beneficiary).trim() : "__________";
    const commissionStr = app.commission ? Number(app.commission).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "__________";
    const contractDatePlaceholder = date;

    return `
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: "Times New Roman", serif; font-size: 12pt; margin:0; padding:0; line-height: 1.5; }
  .page { width: 170mm; margin: 0 auto; }
  .center { text-align: center; }
  .section { margin: 12pt 0; }
  .field { margin: 6pt 0; }
  .underline { border-bottom: 1pt solid #000; display: inline-block; min-width: 120pt; }
  ol { padding-left: 22pt; }
  ol li { margin: 6pt 0; }
</style>
</head>
<body>
<div class="page">
  <div class="center" style="font-weight: bold; margin-bottom: 10pt;">Договор о банковской гарантии № ${contractNumber}</div>
  <div class="center" style="margin-bottom: 10pt;">на обеспечение исполнения обязательств, предусмотренных Контрактом</div>
  <div class="center" style="margin-bottom: 14pt;">г. _________________ от «${docDate.split(".")[0]}» ${docDate.split(".")[1]} ${docDate.split(".")[2]} года</div>

  <p>Банк, именуемый в дальнейшем «Гарант», в лице _____________________, действующего на основании Устава, и</p>
  <p><span class="underline">${principalName}</span>, именуемое в дальнейшем «Принципал», в лице ___________________, действующего на основании Устава, заключили настоящий договор о нижеследующем:</p>

  <div class="section">
    <p>1. Гарант в обеспечение Принципалом своего обязательства выдает Банковскую гарантию № ${guaranteeNumber} от ${date} г. (далее — Гарантия) в пользу <span class="underline">${beneficiary}</span>, именуемое в дальнейшем Бенефициар, на обеспечение исполнения Принципалом обязательств, предусмотренных Контрактом № ${contractNumber} от ${contractDatePlaceholder} г. (далее — «Контракт») в сумме ${amountFormatted} (${amountWords}) рублей.</p>
  </div>

  <div class="section">
    <p>2. В случае нарушения Принципалом обязательств по Контракту Гарант обязуется в соответствии с условиями, изложенными в Гарантии, уплатить Бенефициару указанную в п. 1 настоящего договора денежную сумму по предъявлению последним письменного требования на оплату со ссылкой на конкретные пункты Контракта и приложением документов, подтверждающих факт неисполнения обязательств.</p>
  </div>

  <div class="section">
    <p>3. Бенефициар в письменном требовании об уплате денежной суммы по Гарантии должен указать, в чем состоит нарушение Принципалом своих обязательств, с приложением документов, подтверждающих нарушение.</p>
  </div>

  <div class="section">
    <p>4. Требования по выданной Гарантии могут быть предъявлены по ${endDateStr} г., и все иски в отношении этого предложения должны быть переданы в Банк не позднее этой даты.</p>
  </div>

  <div class="section">
    <p>5. Гарантия не может быть отозвана Гарантом.</p>
    <p>6. Гарантия вступает в силу с ${date} и действует по ${endDateStr} (датой, прописанной в Контракте).</p>
  </div>

  <div class="section">
    <p>7. Гарант обязан рассмотреть требования Бенефициара в течение 5 (пяти) банковских дней и проявить разумную заботливость, чтобы установить, соответствуют ли предъявленные требования условиям Гарантии.</p>
    <p>8. В течение сроков, предусмотренных настоящим Договором и банковской Гарантией, Гарант обязан перечислить на счет Бенефициара сумму, указанную в п. 1 настоящего договора, либо уведомить Бенефициара об отказе удовлетворить его требования.</p>
    <p>9. Гарант вправе отказать Бенефициару, если его требования не соответствуют условиям Гарантии либо представлены Гаранту по окончании срока, определенного в п. 4 и 6 настоящего договора.</p>
  </div>

  <div class="section">
    <p>10. Вознаграждение за выдачу Гарантии уплачивается Принципалом согласно условиям данного Договора. Согласно сроку предоставления гарантии и суммы предусматривается график оплаты комиссии (вознаграждения): сумма <span class="underline">${commissionStr}</span> руб. до ${endYear} г.</p>
  </div>

  <div class="section">
    <p>11. Действие Гарантии прекращается уплатой Бенефициару суммы, на которую выдана Гарантия; окончанием срока, на который выдана Гарантия.</p>
    <p>12. В целях своевременного исполнения обязательств по настоящему договору Принципал предоставляет Гаранту безусловное и безотзывное право списывать денежные средства со счетов Принципала в Банке согласно ордера, составленного Гарантом, либо со счетов Принципала в других банках по платежному требованию. В платежном требовании в обязательном порядке должно быть указано основание списания со ссылкой на настоящий договор.</p>
    <p>13. В случае уплаты Гарантом Бенефициару суммы по банковской Гарантии Принципал обязан возместить Гаранту указанную сумму в течение 3 (трех) банковских дней с даты письменного обращения Гаранта к Принципалу.</p>
  </div>

  <div class="section">
    <p>14. Банковская гарантия № ${guaranteeNumber} от ${date} г., предоставленная по настоящему договору, обеспечивается договором залога / поручительства (при наличии).</p>
    <p>15. Гарант вправе передавать свои права по настоящей банковской гарантии третьим лицам без согласия Принципала.</p>
    <p>16. Принципал обязуется извещать Гаранта об открытии расчетных счетов в других организациях, об изменениях организационно-правовой формы, а также предоставлять по требованию Банка полную и достоверную информацию о своей платежеспособности.</p>
  </div>

  <div class="section">
    <p>17–19. Сведения, определенные законодательством для формирования кредитной истории Принципала, Гарант передает в бюро кредитных историй в установленные законом сроки. Принципал ознакомлен с действующим законодательством РФ по формированию кредитной истории.</p>
    <p>20. Споры разрешаются путем переговоров. При недостижении согласия — в порядке, предусмотренном законодательством Российской Федерации.</p>
    <p>21. Споры Гаранта с Бенефициаром рассматриваются в Арбитражном суде _________________.</p>
  </div>

  <div class="section" style="margin-top: 20pt;">
    <p><strong>22. Юридические адреса и реквизиты сторон:</strong></p>
    <p><strong>Гарант:</strong> Банк<br/>_________________________________<br/>_________________________________</p>
    <p><strong>Принципал:</strong> <span class="underline">${principalName}</span><br/>_________________________________</p>
  </div>

  <div style="margin-top: 24pt; display: table; width: 100%;">
    <div style="display: table-cell; width: 48%;"><strong>Гарант</strong><br/><br/>_______________</div>
    <div style="display: table-cell; width: 48%;"><strong>Принципал</strong><br/><br/>_______________</div>
  </div>
</div>
</body></html>`;
  }

  async function buildGuarantee(appIdOrApp) {
    const app = typeof appIdOrApp === "string" ? DB.state.applications.find((a) => a.id === appIdOrApp) : appIdOrApp;
    if (!app) return alert("Нет заявки.");
    const client = DB.getClient(app.clientId);
    const manager = DB.state.staff.find((s) => s.id === app.managerId);
    const ready = guaranteeTemplate({ app, client, manager });
    downloadDoc(ready, `Zayavlenie_na_BG_${app.id}.doc`);
    try {
      await api.saveDocument(app.rawId || app.id, "guarantee");
    } catch (e) {
      console.error("Failed to save document:", e);
    }
  }

  async function buildContract(appIdOrApp) {
    const app = typeof appIdOrApp === "string" ? DB.state.applications.find((a) => a.id === appIdOrApp) : appIdOrApp;
    if (!app) return alert("Нет заявки.");
    const client = DB.getClient(app.clientId);
    const manager = DB.state.staff.find((s) => s.id === app.managerId);
    downloadDoc(contractTemplate({ app, client, manager }), `Dogovor_o_BG_${app.id}.doc`);
    try {
      await api.saveDocument(app.rawId || app.id, "contract");
    } catch (e) {
      console.error("Failed to save document:", e);
    }
  }

  function bind() {
    // Привязка событий для документов уже реализована через onclick в HTML
  }

  return { bind, buildGuarantee, buildContract };
})();

window.Docs = Docs;
