/**
 * SessionInfo 型です。
 * @typedef {object} SessionInfo
 * @prop {string} session - Jinjerセッション
 * @prop {string} token - Jinjerトークン
 */

/**
 * JinjerにログインしてセッションIDとトークンを得る。
 * @param {string} jinjerUid Jinjer用のログインID
 * @param {string} jinjerPw Jinjerのログインパスワード
 * @return {SessionInfo} sessionInfo ログイン後に取得できるセッションIDとトークン。
 */
function getJinjerLoginInfo(jinjerUid, jinjerPw) {
    var url = "https://kintai.jinjer.biz/v1/manager/sign_in";
    var headers = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest"
    };
    var payload = {
        "email": jinjerUid,
        "password": jinjerPw,
        "company_code": "1180"
    };
    var options = {
        method : 'post',
        headers: headers,
        payload: payload
    };
    var response = UrlFetchApp.fetch(url, options);
    var json = response.getContentText("UTF-8");
    var jsonData = JSON.parse(json);

    // Response Cookie
    var respCookies = [];
    // レスポンスヘッダーからCookieを取得

    var headers = response.getAllHeaders()["Set-Cookie"].join(";").split(";")
        .filter(function(each) {
            return each.indexOf("=") > 0;
        });

    var cookies = underscoreGS._map(headers, function(each) {
        var kv = each.split("=");
        return {key: kv[0], val: kv[1]};
    }).reduce(function(map, obj) {
        map[obj.key] = obj.val;
        return map;
    }, {});

    return {session: cookies["_JINJER_Server_session"], token: jsonData.data.token};
}

/**
 * 打刻グループ一覧を取得。
 * @param {SessionInfo} sessionInfo セッション情報
 * @return {Object} shops 打刻グループ一覧。
 *          [{
 *              "can_edit_shift": bool 
 *              "cutoff_date": number
 *              "id": string // shop_id  ex: "57eb250fff51fe24d812f6d6"
 *              "name": string // shop_name  ex: "株式会社オルトプラス", 
 *              "shop_code": string // "01"
 *          }]
 * 
 */
function getShops(sessionInfo) {
    var url = "https://kintai.jinjer.biz/v1/manager/shops/shops_web";
    var headers = {
        "X-Requested-With": "XMLHttpRequest",
        "Cookie": "_JINJER_Server_session=" + sessionInfo.session,
        "Api-Token": sessionInfo.token
    };

    var options = {
        method : 'get',
        headers: headers
    };
    var response = UrlFetchApp.fetch(url, options);
    var json = response.getContentText("UTF-8");
    var jsonData = JSON.parse(json);

    return jsonData.data.shops;
}

/**
 * タイムカード一覧を取得。
 * @param {SessionInfo} sessionInfo セッション情報
 * @return {Object} timecards タイムカード一覧。
 */
function getTimeCardsInfo(sessionInfo, shopId) {
    var url = "https://kintai.jinjer.biz/v1/manager/timecard_shifts/schedule_date";
    var headers = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Cookie": "_JINJER_Server_session=" + sessionInfo.session,
        "Api-Token": sessionInfo.token
    };
    var payload = {
        "shop_ids": shopId,
        "date": CUtils.getDateString(new Date(), "-"),
        "per_page": "10",
        "page": "1",
        "display_user_shift": "0"
    };

    var options = {
        method : 'post',
        headers: headers,
        payload: payload
    };
    var response = UrlFetchApp.fetch(url, options);
    var json = response.getContentText("UTF-8");
    var jsonData = JSON.parse(json);

    return jsonData.data[0].users;
}

/**
 * 申請一覧を取得。
 * @param {SessionInfo} sessionInfo セッション情報
 * @return {Object} timecards タイムカード一覧。
 */
function getRequestByStaff(sessionInfo, shopId) {
    var prop =  PropertiesService.getScriptProperties().getProperties();

    var url = "https://kintai.jinjer.biz/v1/manager/time_cards/list_request_by_staff";
    var headers = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Cookie": "_JINJER_Server_session=" + sessionInfo.session,
        "Api-Token": sessionInfo.token
    };
    var dt = new Date();
    var payload = {
        "shop_ids": shopId,
        "year": ("0000" + (dt.getFullYear())).slice(-4),
        "month": ("00" + (dt.getMonth()+1)).slice(-2),
        "per_page": "10"
    };

    var options = {
        method : 'post',
        headers: headers,
        payload: payload
    };
    var response = UrlFetchApp.fetch(url, options);
    var json = response.getContentText("UTF-8");
    var jsonData = JSON.parse(json);

    return jsonData.data[0].timecards.filter(function(each) {
        if (each.time_card.request_update_status == 0) {
            return true;
        }
    });
}

