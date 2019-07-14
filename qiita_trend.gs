// Qiita info  ----- Qiita API Document <http://qiita.com/docs> ------
var qiitaBaseURL  = "https://qiita.com/";
var qiitaColor    = "#5ac300"

// Slack info
var slackIncomingURL   = '<----- your incomingwebhook URl ----->'
var channel            = "<----- your channel name ----->"

function postQiitaNewTrends() {
  var attachments = getQiitaPost(qiitaBaseURL)
  var text        = '今週もお疲れ様です。人気記事のお知らせです。（本家サイトは毎日５時/17時に更新されています）'
  postSlack(slackIncomingURL, 'Qiita bot', ':qiitan:', text, attachments)
}

// Qiita API test request
function getQiitaPost(url) {
  var attachments = []
  var html  = UrlFetchApp.fetch(url).getContentText();
  Logger.log(html);
  var items = Parser.data(html).from('{&quot;followingLikers').to('}}}').iterate()
  for (var i = 0; i < 10; i++) {
    var isNewArrival    = items[i].match(/isNewArrival&quot;:(.+?),/)[1]
    var createdAt       = items[i].match(/createdAt&quot;:&quot;(.+?)&quot;,/)[1]
    var likesCount      = items[i].match(/likesCount&quot;:(.+?),/)[1]
    var title           = items[i].match(/title&quot;:&quot;(.+?)&quot;,/)[1]
    var uuid            = items[i].match(/uuid&quot;:&quot;(.+?)&quot;,/)[1]
    var profileImageUrl = items[i].match(/profileImageUrl&quot;:&quot;(.+?)&quot;,/)[1]
    var urlName         = items[i].match(/urlName&quot;:&quot;(.+?)&quot;/)[1]
    var titleLink       = qiitaBaseURL + '/' + urlName + '/items/' + uuid
    attachments.push(makeQiitaAttachment(isNewArrival, createdAt, likesCount, title, profileImageUrl, urlName, titleLink, i))
  }
  return attachments
}

function makeQiitaAttachment(isNewArrival, createdAt, likesCount, title, profileImageUrl, urlName, titleLink, i) {
  return makeAttachment (
    qiitaColor,
    '*No.' + (i + 1) + '*',
    title,
    titleLink,
    profileImageUrl,
    makeQiitaFields(isNewArrival, createdAt, likesCount, urlName)
)}

function makeAttachment(qiitaColor, pretext, title, titleLink, profileImageUrl, fields) {
  return {
    color      : qiitaColor,
    pretext    : pretext,
    title      : title,
    title_link : titleLink,
    thumb_url  : profileImageUrl,
    fields     : fields
  }
}

function makeQiitaFields(isNewArrival, createdAt, likesCount, urlName) {
  var fields = [
    makeField('投稿者', urlName, true),
    makeField('投稿日時', setJSTtime(createdAt), true),
    makeField('いいね', likesCount, true),
  ]
  if (isNewArrival == 'true') {
      fields.push(makeField('新着', "", true))
  }
  return fields
}

function setJSTtime(createdAt) {
  var createdAt = new Date(createdAt)
  var year    = createdAt.getFullYear()
  var month   = createdAt.getMonth() + 1
  var day     = createdAt.getDate()
  var hour    = createdAt.getHours()
  var minutes = createdAt.getMinutes()
  return year + "年" + month + "月" + day + "日 " + hour + "時" + minutes + "分"
}

function makeField(title, value, short) {
  return {
    title: title,
    value: value,
    short: short,
  }
}

function postSlack(slackIncomingURL, username, iconEmoji, text, attachments) {
  var payload = {
    //channel   : channel,
    username    : username,
    icon_emoji  : iconEmoji,
    text        : text,
    attachments : attachments,
  }
  var options = {
    "method"      : "post",
    "contentType" : "application/json",
    "payload"     : JSON.stringify(payload),
    "muteHttpExceptions" : true
  }
  UrlFetchApp.fetch(slackIncomingURL, options)
}
