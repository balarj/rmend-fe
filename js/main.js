/*

TODOs:
    1. If there is not UUID provided.. show no content at all,  or show static content (like a preview)
*/

var App = function() {

    console.log("initializing app");

    this.topics = {};
    this.currentTopic = null;
    this.uuid = null; //c3b1abc4-0b87-4d76-be09-b7440de2f690
    this.uid = null;
    this.recommendationHandler = new RecommendationHandler();
    this.initUI();

    //refactor this into a fn()
    var urlParamUUID = this.getURLParameter("uuid");
    if (urlParamUUID) {
        console.log("urlParamUUID: " + urlParamUUID);
        this.getUserDetails(urlParamUUID);
    } else {
        this.greet();
    }
}

var RecommendationHandler = function() {
    console.log("Initializing RecommendationHandler instance");

    this.recommendations = [];
}

App.prototype = {
    constructor: App,
    initUI: function() {
        var instance = this;

        // topic click handler
        $(".topic").on("click", function(e) {
            e.preventDefault();
            var topic = $(this).attr('topic');
            if (topic) {
                console.log(topic + "clicked");
                instance.currentTopic = topic;
                instance.getDocumentsByTopic(topic);
            }
        });

        // document (under topic) click handler
        $("#docs-by-topic").on("click", 'a', function(e) {
            var index = $(this).index();
            console.log("doc clicked | index: " + index);

            var doc = instance.getDocumentAtIndexForTopic(index);
            if (doc) {
                var lightBoxHTML = '<h2>' + doc.title + '</h2><div class="margin-top">' + doc.docBody.replace(/(?:\r\n|\r|\n|\n\n)/g, '<br />') + '</div>';
                $("#mylightbox").html(lightBoxHTML);

                // user impression
                if (instance.uid) {
                    instance.sendUserImpression(instance.uid, doc.docNum, "TOPICS");
                }
            }

            // Generate recommendations
            if (instance.uid) {
                instance.getRecommendations(instance.uid, doc.docNum);
            }

        });

        // document refresh handler
        $("#refresh-documents").on("click", function(e) {
            instance.getDocumentsByTopic(instance.currentTopic);
        });

        // click handler for documents under recommendations
        $("#docs-recommended").on("click", 'a', function(e) {
            var index = $(this).index();
            console.log("doc clicked | index: " + index);

            var doc = instance.getDocumentAtIndexForReco(index);
            if (doc) {
                var lightBoxHTML = '<h2>' + doc.title + '</h2><div class="margin-top">' + doc.docBody.replace(/(?:\r\n|\r|\n|\n\n)/g, '<br />') + '</div>';
                $("#mylightbox").html(lightBoxHTML);

                // user impression
                if (instance.uid) {
                    console.log('docMeta: ' + $(this).children("#docMeta"));
                    //instance.sendUserImpression(instance.uid, doc.docNum, "TOPICS");
                }
            }

            // Generate recommendations
            if (instance.uid) {
                //instance.getRecommendations(instance.uid, doc.docNum);
            }

        });
    },

    getUserDetails: function(uuid) {
        var instance = this;
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": "{0}/user/uuid/{1}".format(Config.BASE_URL, uuid),
            "method": "GET",
            "headers": {}
        }

        $.ajax(settings).done(function(response) {
            console.log(response);
            if (response.uuid && response.uid && response.userName) {
                instance.uuid = response.uuid;
                instance.uid = response.uid;
                instance.greet(response.userName);
            }

        }).fail(function(error) {
            console.log("Error: user get");
            instance.greet(404);
        });
    },

    greet: function(name) {
        var msg;

        if (name && isNaN(name)) {
            msg = "Welcome " + name;
        } else if (name == 404) {
            msg = "Hey stranger. No recommendations for you.";
        } else {
            msg = "Welcome guest. No recommendations for you.";
        }

        $("#welcome-greeting").text(msg);
    },

    getDocumentsByTopic: function(topic) {
        var instance = this;
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": Config.BASE_URL + "/document/topic/" + topic,
            "method": "GET",
            "headers": {}
        }

        $.ajax(settings).done(function(response) {
            console.log(response);
            instance.currentTopic = topic;
            instance.topics[topic] = response;
            instance.updateTopicDocumentsView(response);
        }).fail(function(error) {
            console.log("Error: topic get");
        });
    },

    getDocumentAtIndexForTopic: function(index) {
        if (this.currentTopic && this.topics) {
            var documents = this.topics[this.currentTopic];
            var doc = documents[index];
            return doc;
        }
        return null;
    },

    getDocumentAtIndexForReco: function(index) {
        if (this.recommendations) {
            var doc = this.recommendations[index];
            return doc;
        }
        return null;
    },

    updateTopicDocumentsView: function(documents, recType) {
        $("#docs-by-topic").empty();

        recType = recType || "TOPIC";

        var currentTopic = this.currentTopic;
        var topics = this.topics;

        if (currentTopic && topics) {
            var i, doc;
            var documents = topics[currentTopic];
            for (i in documents) {
                doc = documents[i]
                //console.log(doc);
                var docHTML = '<a href=#><span id="docMeta">' + recType + ':' + doc.docNum + '</span>' +
                '<div class="doc" data-featherlight="#mylightbox">' + doc.title.substring(0, 15); + '</div></a>'
                $("#docs-by-topic").append(docHTML);

            }
        }
    },

    updateRecommendedDocumentsView: function(recommendations) {
        // clear out the container
        $("#docs-recommended").empty();
        console.log(recommendations);

        if (recommendations) {
            var i, doc;
            for (i in recommendations) {
                recommendedDoc = recommendations[i];
                console.log(recommendedDoc);
                doc = recommendedDoc.recDocument;
                //console.log(doc);
                var docHTML = '<a href=#><span id="docMeta">' + recommendedDoc.recType + ':' + doc.docNum + '</span>' +
                '<div class="doc" data-featherlight="#mylightbox">' + doc.title.substring(0, 15); + '</div></a>'
                $("#docs-recommended").append(docHTML);
            }
        }
    },

    sendUserImpression: function(uid, docNum, referrer) {
        var settings = {
            async: true,
            crossDomain: true,
            url: "{0}/view/impression?referrer={1}".format(Config.BASE_URL, referrer),
            method: "PUT",
            headers: {
                "content-type": "application/json",
            },
            processData: true,
            data: JSON.stringify({
                "uid": uid,
                "docNum": docNum
            }),
        }

        console.log(settings);

        $.ajax(settings).done(function (data, textStatus, xhr) {
            console.log(textStatus);
        }).fail(function(error) {
            console.log("Error in capturing user impression: ", JSON.stringify(error));
        });
    },

    getRecommendations: function(uid, docNum) {
        var instance = this;
        var recommendations = [];

        // stub for calling out both content-based and collaborative filtering methods.
        recommendations.push(instance.getContentBasedRecos(docNum));
        console.log(recommendations);

        // TODO: implement logic for calling CF recommendations also
        // var cfRecos = instance.getCollaborativeFilteringRecos(docNum);

        // TODO: Aggregate and display
    },

    getContentBasedRecos: function(docNum, resultType) {
        var instance = this;
        resultType = resultType || "TOP_10";

        // stub for calling out content based recommender
        var settings = {
            async: true,
            crossDomain: true,
            url: "{0}/recommend/content/{1}".format(Config.BASE_URL, docNum),
            method: "GET",
            processData: true,
            data: {
                "resultType": resultType,
            },
        }

        $.ajax(settings).done(function (data, textStatus, xhr) {
            console.log('received ' + xhr.status);
            var recType = xhr.getResponseHeader('X-Recommendation-Type');
            var results = [];
            if (xhr.status == 200 && data) {
                data.forEach(function (element) {
                    results.push(instance.buildRecommendationMeta(element, recType));
                });
            }
            instance.updateRecommendedDocumentsView(results);
            return results;
        }).fail(function (data, textStatus, xhr) {
            console.log("Error in retrieving content based recommendations: ", JSON.stringify(data));
        });
    },

    getCollaborativeFilteringRecos: function(uid, docNum, resultType) {
        var instance = this;
        resultType = resultType || "RANDOM_10";

        // stub for calling out CF based recommender
    },

    getURLParameter: function(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null
    },

    buildRecommendationMeta: function(recDoc, recType) {
        var retVal = {
            'recDocument': recDoc,
            'recType': recType,
        };
        return retVal;
    },

    /**
     * Credits: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
     */
    logArrayElements: function(element, index, array) {
      console.log('a[' + index + '] = ' + JSON.stringify(element));
    }
};

RecommendationHandler.prototype = {
    print: function() {
        var instance = this;
        console.log(instance.recommendations);
    }
}
/**
 *  Credits : http://stackoverflow.com/questions/25227119/javascript-strings-format-is-not-defined
 */
String.prototype.format = function() {
    var args = [].slice.call(arguments);
    return this.replace(/(\{\d+\})/g, function(a) {
        return args[+(a.substr(1, a.length - 2)) || 0];
    });
};

// ------------------------------------------
// initialize app
// ------------------------------------------
var app;

$(document).ready(function() {
    app = new App();
});