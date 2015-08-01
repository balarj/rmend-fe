/*

TODOs:
    1. If there is not UUID provided.. show no content at all,  or show static content (like a preview)
    2. Disable clicking "Some Document placeholder"
*/

var App = function() {

    console.log("initializing app");

    this.topics = {};
    this.currentTopic = null;
    this.uuid = null; //c3b1abc4-0b87-4d76-be09-b7440de2f690
    this.uid = null;
    this.recommendationHandler = new RecommendationHandler(this);
    this.initUI();

    //refactor this into a fn()
    var urlParamUUID = this.getURLParameter("uuid");
    if (urlParamUUID) {
        console.log("urlParamUUID: " + urlParamUUID);
        this.getUserDetails(urlParamUUID);
    } else {
        this.greet();
    }
};

var RecommendationHandler = function(parent) {

    console.log("Initializing RecommendationHandler instance");

    this.recommendations = [];
    this.errorMsg = null;
    this.parent = parent;
};

App.prototype = {
    constructor: App,
    initUI: function() {
        var instance = this;

        // lightbox default behavior
        $.featherlight.defaults.afterClose = function() {
            var errorMsg = instance.recommendationHandler.getErrors();
            if (errorMsg) {
                toastr.warning(errorMsg, {
                    "timeOut": "2000",
                    "progressBar": true,
                });
            }
            instance.recommendationHandler.resetErrors();
        };

        // topic click handler
        $(".topic").on("click", function(e) {
            e.preventDefault();
            var topic = $(this).attr('topic');
            if (topic) {
                $("#docs-recommended").empty();
                console.log(topic + " - clicked");
                instance.currentTopic = topic;
                instance.getDocumentsByTopic(topic);
            }
        });

        // document (under topic) click handler
        $("#docs-by-topic").on("click", 'a', function(e) {
            var index = $(this).index();
            //console.log("doc clicked | index: " + index);

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
            //console.log("doc clicked | index: " + index);

            var rMetaInstance = instance.recommendationHandler.getDocumentAtIndex(index);
            if (rMetaInstance) {
                var doc = rMetaInstance.recDocument;
                var lightBoxHTML = '<h2>' + doc.title + '</h2><div class="margin-top">' + doc.docBody.replace(/(?:\r\n|\r|\n|\n\n)/g, '<br />') + '</div>';
                $("#mylightbox").html(lightBoxHTML);

                // capture user impression
                if (instance.uid && doc) {
                    instance.sendUserImpression(instance.uid, doc.docNum, rMetaInstance.recType);
                }
            }

            // Generate recommendations
            if (instance.uid) {
                instance.getRecommendations(instance.uid, doc.docNum);
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
        };

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
        };

        $.ajax(settings).done(function(response) {
            //console.log(response.length);
            instance.currentTopic = topic;
            instance.topics[topic] = response;
            instance.updateTopicDocumentsView();
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
        var recommendations = this.recommendationHandler.recommendations;
        if (recommendations) {
            var doc = this.recommendations[index];
            return doc;
        }
        return null;
    },

    updateTopicDocumentsView: function(recType) {
        $("#docs-by-topic").empty();

        recType = recType || "TOPIC";

        var currentTopic = this.currentTopic;
        var topics = this.topics;

        if (currentTopic && topics) {
            var i, doc;
            var documents = topics[currentTopic];
            for (i in documents) {
                doc = documents[i];
                //console.log(doc);
                var docHTML = '<a href=#><span id="docMeta">' + recType + ':' + doc.docNum + '</span>' +
                    '<div class="doc" data-featherlight="#mylightbox">' + doc.title.substring(0, 15) + '</div></a>';
                $("#docs-by-topic").append(docHTML);

            }
        }
    },

    updateRecommendedDocumentsView: function(recommendations) {
        // clear out the container
        $("#docs-recommended").empty();
        //console.log(recommendations);

        if (recommendations) {
            var i, doc;
            for (i in recommendations) {
                var recommendedDoc = recommendations[i];
                //console.log(recommendedDoc);
                doc = recommendedDoc.recDocument;
                //console.log(doc);
                var docHTML = '<a href=#><span id="docMeta">' + recommendedDoc.recType + ':' + doc.docNum + '</span>' +
                    '<div class="doc" data-featherlight="#mylightbox">' + doc.title.substring(0, 15) + '</div></a>';
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
        };

        //console.log(settings);

        $.ajax(settings).done(function(data, textStatus, xhr) {
            console.log('(PUT impression) status: ' + xhr.status);
        }).fail(function(error) {
            console.log("Error in capturing user impression: ", JSON.stringify(error));
        });
    },

    getRecommendations: function(uid, docNum) {
        var instance = this;

        // stub for calling out both content-based and collaborative filtering methods.
        instance.recommendationHandler.getContentBasedRecos(docNum);

        // TODO: implement logic for calling CF recommendations also
        instance.recommendationHandler.getCFRecos(docNum);
    },

    getURLParameter: function(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
    },

    /**
     * Credits: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
     */
    logArrayElements: function(element, index, array) {
        console.log('a[' + index + '] = ' + JSON.stringify(element));
    }
};

RecommendationHandler.prototype = {

    constructor: RecommendationHandler,
    print: function() {
        var instance = this;
        console.log(instance.recommendations);
    },

    update: function(recommendations) {
        var instance = this;
        for (rec in recommendations) {
            instance.recommendations.push(recommendations[rec]);
        }
    },

    getErrors: function() {
        return this.errorMsg;
    },

    resetErrors: function() {
        this.errorMsg = null;
    },

    refresh: function() {
        var instance = this;
        instance.parent.updateRecommendedDocumentsView(instance.shuffle(instance.recommendations).slice(0, 10));
    },

    getDocumentAtIndex: function(index) {
        if (this.recommendations) {
            var doc = this.recommendations[index];
            return doc;
        }
        return null;
    },

    manangeFailure: function(xhr) {
        var instance = this;
        var errorMsg = 'Error (' + xhr.status + "): " + xhr.getResponseHeader('X-Error-Msg');
        switch (xhr.status) {
            case 500:
            case 404:
                console.log(errorMsg);
                instance.errorMsg = errorMsg;
                break;
        }
    },

    manageSuccess: function(data, xhr) {
        var instance = this;
        var recType = xhr.getResponseHeader('X-Recommendation-Type');
        var results = [];
        if (xhr.status == 200 && data) {
            data.forEach(function(element) {
                results.push(instance.buildRMeta(element, recType));
            });
        }
        instance.update(results);
        instance.refresh();
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
        };

        $.ajax(settings).done(function(data, textStatus, xhr) {
            console.log('(GET content reco) status: ' + xhr.status);
            instance.manageSuccess(data, xhr);
        }).fail(function(xhr, textStatus, errorThrown) {
            instance.manangeFailure(xhr);
        });
    },

    getCFRecos: function(docNum, resultType) {
        var instance = this;
        resultType = resultType || "RANDOM_10";

        // stub for calling out content based recommender
        var settings = {
            async: true,
            crossDomain: true,
            url: "{0}/recommend/cf/document/{1}".format(Config.BASE_URL, docNum),
            method: "GET",
            processData: true,
            data: {
                "resultType": resultType,
            },
        };

        $.ajax(settings)
        .done(function(data, textStatus, xhr) {
            console.log('(GET cf reco) status: ' + xhr.status);
            instance.manageSuccess(data, xhr);
        }).fail(function(xhr, textStatus, errorThrown) {
            instance.manangeFailure(xhr);
        });
    },

    buildRMeta: function(recDoc, recType) {
        var retVal = {
            'recDocument': recDoc,
            'recType': recType,
        };
        return retVal;
    },

    /**
     * Source: http://bost.ocks.org/mike/shuffle/
     */
    shuffle: function(array) {
        var m = array.length,
            t, i;

        // While there remain elements to shuffle…
        while (m) {

            // Pick a remaining element…
            i = Math.floor(Math.random() * m--);

            // And swap it with the current element.
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }

        return array;
    }
};
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