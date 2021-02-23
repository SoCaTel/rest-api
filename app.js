const graphql = require('graphql-request');
const app = require('express')()
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
var auth = require('http-auth');
const _Config = require('./config.js');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = YAML.load('socatel-api-endpoints.yml');
const { Client } = require('@elastic/elasticsearch');
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
var tinyTfidfNode = require("tiny-tfidf-node");
var requestCountry = require("request-country")
var request = require('request');

const mongo_url = 'mongodb://' + _Config.MongoDB_Username + ':' + _Config.MongoDB_Password + 
    '@' + _Config.MongoDB_Host + ':' + _Config.MongoDB_Port + '/' // + DATABASENAME

const client = new graphql.GraphQLClient(_Config.GraphQL_Endpoint, {
  headers: {
    Authorization: _Config.GraphQL_Authorisation,
  },
})

const es_client = new Client({ 
    node: _Config.Elasticsearch_Endpoint,
    headers: {
        Authorization: _Config.Elasticsearch_Authorisation
    }
})

const allowed_langs = ["fr", "en", "es", "ca", "hu", "ga", "fi"]

// TESTING CODE FOR GRAPHQL
//var query = _Config.qraphql_q_transformation(_Config.graphql_twSearchByTopics, ["blog"], true, "$topics");
//var query = _Config.qraphql_q_transformation(_Config.graphql_multiplePostsByTopics, ["blog"], true, "$topics");
//var query = _Config.qraphql_q_transformation(_Config.qraphql_postsById, "1101908829393113088", false, "$identifier");
//var query = _Config.qraphql_q_transformation(_Config.graphql_search_for_posts, 5, false, "$limit");
//var query = _Config.graphql_introspect_post_type;
// client.request(query).then(data => 
//     console.log(data)
// );

var users = [];
users[_Config.restapi_username] = _Config.restapi_password;

var basic_auth = basicAuth({
    users: users,
    unauthorizedResponse: function(req){
        return req.auth
        ? ('Credentials ' + req.auth.user + ':' + req.auth.password + ' rejected')
        : 'No credentials provided'
    }
});

app.use(bodyParser.json({ type: 'application/json' }))

app.post('/api/graphql_twSearchByTopics', basic_auth, (req, res) => {
	try {
		if (req.body === "undefined" || req.body.topics === "undefined" || !Array.isArray(req.body.topics)){
			throw "There is not an array of topics that is sent with the request. Abort!"
		}
		var query = _Config.query_body_transformation(_Config.graphql_twSearchByTopics, req.body.topics, true, "$topics");

		//Include language
		if (req.body.language !== "undefined" && req.body.language !== '' && req.body.language !== null){
			query = _Config.query_body_transformation(query, req.body.language, false, "$language");
		}    

		return client.request(query).then(data => 
			res.send(data)
		);
	} catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
});

app.post('/api/graphql_multiplePostsByTopics', basic_auth, (req, res) => {
	try {
		if (req.body === undefined || req.body.topics === undefined || !Array.isArray(req.body.topics)){
			throw "There is not an array of topics that is sent with the request. Abort!"
		}
		var query =_Config.query_body_transformation(_Config.graphql_multiplePostsByTopics, req.body.topics, true, "$topics");   

		//Include language
		if (req.body.language !== undefined && req.body.language !== '' && req.body.language !== null){
			query = _Config.query_body_transformation(query, req.body.language, false, "$language");
		}    

		return client.request(query).then(data => 
			res.send(data)
		);
	} catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
});


app.post('/api/graphql_servicesByTopics/:from/:to', basic_auth, (req, res) => {
    try {
        if (req.body === undefined || req.body.topics === undefined || !Array.isArray(req.body.topics)){
            throw "There is not an array of topics that is sent with the request. Abort!"
        }
        var query =_Config.query_body_transformation(_Config.graphql_services_by_topics, req.body.topics, true, "$topics");   

        //Include language
        if (req.body.language !== undefined && req.body.language !== '' && req.body.language !== null){
            query = _Config.query_body_transformation(query, req.body.language, false, "$language");
        }

        var query_from =_Config.query_body_transformation(query, req.params.from, false, "$from")
        var query =_Config.query_body_transformation(query_from, req.params.to, false, "$to")

        return client.request(query).then(data => 
            res.send(data)
        );
    } catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
})

app.get('/api/graphql_introspect_post_type', basic_auth, (req, res) => {
	try {
		var query = _Config.graphql_introspect_post_type;
		return client.request(query).then(data => 
			res.send(data)
		);    
	} catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
});


app.get('/api/graphql_postsById/:id', basic_auth, (req, res) => {
	try {
		if (req.params === undefined || req.params.id === undefined){
			throw "There is no :id URL param sent with the request. Abort!"
		}
		var query = _Config.query_body_transformation(_Config.graphql_postsById, req.params.id, false, "$identifier");
		return client.request(query).then(data => 
			res.send(data)
		);
	} catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
});

app.get('/api/graphql_search_for_posts/:limit', basic_auth, (req, res) => {
	try {
		if (req.params === undefined || req.params.limit === undefined){
			throw "There is no :id URL param sent with the request. Abort!"
		}
		var query =_Config.query_body_transformation(_Config.graphql_search_for_posts, req.params.limit, false, "$limit")
		return client.request(query).then(data => 
			res.send(data)
		);
	} catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
});


app.get('/api/graphql_service/:id', basic_auth, (req, res) => {
	try {
		if (req.params === undefined || req.params.id === undefined){
			throw "There is no :id URL param sent with the request. Abort!"
		}
		var query =_Config.query_body_transformation(_Config.graphql_service_by_id, req.params.id, false, "$id")
		return client.request(query).then(data => 
			res.send(data)
		);    
	} catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
});


app.get('/api/graphql_service_offset/:from/:to', basic_auth, (req, res) => {
	try {
		if (req.params === undefined || req.params.from === undefined || req.params.to === undefined){
			throw "There is either no :from or :to in URL param sent with the request. Abort!"
		}
		var query_from =_Config.query_body_transformation(_Config.graphql_service_by_offset, req.params.from, false, "$from")
		var query =_Config.query_body_transformation(query_from, req.params.to, false, "$to")
		return client.request(query).then(data => 
			res.send(data)
		);    
	} catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
});

// // ---- RDI

app.get('/api/elasticsearch_getMostViewedAndJoinedGroups/:timestamp_from/:timestamp_to/:size', basic_auth, (req, res) => {
    try {
        timestamp_from = ((req.params.timestamp_from == "undefined") ? 0 : req.params.timestamp_from)
        var query_from = _Config.query_body_transformation(_Config.es_getViewsAndJoinsSumsAllGroups, 
            timestamp_from, false, "$timestamp_from")

        timestamp_to = ((req.params.timestamp_to == "undefined") ? new Date().getTime() : req.params.timestamp_to)
        var query_to = _Config.query_body_transformation(query_from, timestamp_to, false, "$timestamp_to")

        size = ((req.params.size == "undefined") ? _Config.Elasticsearch_default_agg_size : req.params.size)
        var query = _Config.query_body_transformation(query_to, size, false, "$size")

        var query = _Config.es_query_finalisation(query)
        es_client.search({ index: _Config.Elasticsearch_socatel_history_index, body: query}, function (err, result) {
            if (err){
                console.log(err.message)  
                return res.status(500).send([])
            } else {
                try {
                    var buckets = result.body.aggregations.groups.buckets
                    var out = []

                    // Rename fields for better readability.
                    if (buckets.length > 0) {
                        buckets.forEach(function(bucket){
                            var cur_out = {}
                            
                            cur_out["group_id"] = parseInt(bucket["key"])
                            cur_out["total_views_and_subs"] = bucket["doc_count"]

                            if (bucket["history_type"]["buckets"][0]["key"] == _Config.Elasticsearch_view_history_type){
                                // Views listed first.
                                cur_out["total_views"] = bucket["history_type"]["buckets"][0]["doc_count"]
                                
                                // Are there any subs for this group?
                                if (bucket["history_type"]["buckets"].length > 1) {
                                    cur_out["total_joins"] = bucket["history_type"]["buckets"][1]["doc_count"]
                                }
                            } else {
                                // Joins listed first, although this is highly unlikely
                                cur_out["total_joins"] = bucket["history_type"]["buckets"][0]["doc_count"]

                                // Are there any views? (even more of an unlikely scenario)
                                if (bucket["history_type"]["buckets"].length > 1) {
                                    cur_out["total_views"] = bucket["history_type"]["buckets"][1]["doc_count"]
                                }
                            }

                            out.push(cur_out)
                        })
                    }

                    return res.send(out)
                } catch (err) {
                    console.log(err.message)
                    return res.status(500).send([])
                }
            }
        })
    } catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
});

app.get('/api/elasticsearch_getMostPostedInGroups/:timestamp_from/:timestamp_to/:size', basic_auth, (req, res) => {
    try { 
        timestamp_from = ((req.params.timestamp_from == "undefined") ? 0 : req.params.timestamp_from)
        var query_from = _Config.query_body_transformation(_Config.es_getMostPostedInGroups, 
            timestamp_from, false, "$timestamp_from")

        timestamp_to = ((req.params.timestamp_to == "undefined") ?  new Date().getTime() : req.params.timestamp_to)
        var query_to = _Config.query_body_transformation(query_from, timestamp_to, false, "$timestamp_to")

        size = ((req.params.size == "undefined") ? _Config.Elasticsearch_default_agg_size : req.params.size)
        var query = _Config.query_body_transformation(query_to, size, false, "$size")

        var query = _Config.es_query_finalisation(query)
        es_client.search({ index: _Config.Elasticsearch_socatel_posts_index, body: query}, function (err, result) {
            if (err){
                console.log(err.message)  
                return res.status(500).send([])
            } else {
                try {
                    var out = []
                    if (result.body.aggregations.posts_in_groups.buckets.length > 0) {
                        result.body.aggregations.posts_in_groups.buckets.forEach(function(bucket){
                            var cur_out = {}
                            cur_out["group_id"] = parseInt(bucket["key"])
                            cur_out["no_of_posts"] = bucket["doc_count"]

                            out.push(cur_out)
                        })
                    }


                    return res.send(out)
                } catch(err) {
                    console.log(err.message)
                    return res.status(500).send([])
                }
            }
        })
    } catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
});

app.get('/api/elasticsearch_getMostTrendingGroups/:timestamp_from/:timestamp_to', basic_auth, (req, res) => {
    try {
        timestamp_from = ((req.params.timestamp_from == "undefined" || isNaN(req.params.timestamp_from)) ? 0 : req.params.timestamp_from)
        timestamp_to = ((req.params.timestamp_to == "undefined" || isNaN(req.params.timestamp_to)) ? new Date().getTime() : req.params.timestamp_to)
        
        avg_likes = []
        unique_users = []
        most_liked_group_ids = []

        var query_from = _Config.query_body_transformation(
            _Config.es_getPostStatsPerGroupAndTimeframe, timestamp_from, false, "$timestamp_from")

        var query_to = _Config.query_body_transformation(query_from, timestamp_to, false, "$timestamp_to")

        var likes_query = _Config.query_body_transformation(query_to, 
            _Config.Elasticsearch_post_likes_field_name, false, "$field_name")

        var likes_query = _Config.es_query_finalisation(likes_query)
        es_client.search({ 
            index: _Config.Elasticsearch_socatel_posts_index, body: likes_query}, function (err, result) {
            if (err){
                console.log(err.message)
                return res.status(500).send([])
            } else {
                try {
                    if (result.body.aggregations.totals.buckets.length > 0) {
                        result.body.aggregations.totals.buckets.forEach(function(bucket){
                            avg_likes.push(bucket.facets.avg)
                            most_liked_group_ids.push(bucket.key)
                            unique_users.push(bucket.unique_users.value)
                        })
                    }

                    out = []
                    unique_users.map(function (num, idx) {
                        // cur_out["group_id"] = parseInt(most_liked_group_ids[idx])
                        // cur_out["trend_score"] = num * avg_likes[idx]
                        out[parseInt(most_liked_group_ids[idx])] = num * avg_likes[idx]
                    })  
                    
                    return res.send(_Config.sort_dict_by_value(out, "group_id", "trend_score", true))
                } catch(err) {
                    console.log(err.message)
                    return res.status(500).send([])
                }
            }
        })
    } catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
})

app.get('/api/elasticsearch_getUserDemographicsGivenGroup/:group_id', basic_auth, (req, res) => {
    try {
        var query_group = _Config.query_body_transformation(_Config.es_getUserDemographicsGivenGroup, 
            req.params.group_id, false, "$group_id")

        var query = _Config.es_query_finalisation(query_group)
        es_client.search({ index: _Config.Elasticsearch_socatel_user_index, body: query}, 
            function (err, result) {
                if (err){
                    console.log(err.message)  
                    return res.status(500).send([])
                } else {
                    return res.send(result.body.aggregations)
                }
        })
    } catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
})

app.get('/api/elasticsearch_getGroupThemesPopularity/:size', basic_auth, (req, res) => {
    try {
        var query_size = _Config.query_body_transformation(_Config.es_getGroupCategorisationStats, 
            req.params.size, false, "$size")

        var query = _Config.es_query_finalisation(query_size)
        es_client.search({ index: _Config.Elasticsearch_socatel_group_index, body: query}, 
            function (err, result) {
                if (err){
                    console.log(err.message)  
                    return res.status(500).send([])
                } else {
                    try {
                        var out = []

                        if (result.body.aggregations.popular_themes.buckets.length > 0) {
                            result.body.aggregations.popular_themes.buckets.forEach(function(bucket){
                                var cur_out = {}

                                cur_out["theme_id"] = parseInt(bucket["key"])
                                cur_out["total_groups"] = bucket["doc_count"]

                                out.push(cur_out)
                            })
                        }

                        return res.send(out)
                    } catch (err) {
                        console.log(err.message)
                        return res.status(500).send([])
                    }
                }
        })
    } catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
})

app.get('/api/elasticsearch_getMostPopularGroupsByPopRatioLocalityFiltered/:timestamp_from/:timestamp_to/:locality_id', basic_auth, (req, res) => {
    try {
        filtered_group_ids = []
        group_pop_ratio = {} // group and popularity ratio
    
        timestamp_from = ((req.params.timestamp_from == "undefined" || isNaN(req.params.timestamp_from)) ? 0 : req.params.timestamp_from)
        var query_from = _Config.query_body_transformation(_Config.es_filterGroupsByLocality, 
            timestamp_from, false, "$timestamp_from")

        timestamp_to = ((req.params.timestamp_to == "undefined" || isNaN(req.params.timestamp_to)) ? new Date().getTime() : req.params.timestamp_to)
        var query_ts = _Config.query_body_transformation(query_from, timestamp_to, false, "$timestamp_to")

        var query_locality = _Config.query_body_transformation(query_ts, req.params.locality_id, false, "$locality_id")

        var query = _Config.es_query_finalisation(query_locality)
        es_client.search({ index: _Config.Elasticsearch_socatel_group_index, body: query}, 
            function (err, result) {
                if (err){
                    console.log(err.message)  
                    return res.status(500).send([])
                } else {
                    try {
                        // Now get the popularity ratio for each of the returned groups
                        if (result.body.hits.hits.length > 0) {
                            result.body.hits.hits.forEach(function(hit){
                                filtered_group_ids.push(hit._source.group_id)
                            })
                        }
                        
                        inner_query_groups = _Config.query_body_transformation(
                            _Config.es_getViewsAndJoinsSumsPerGivenGroup, JSON.stringify(filtered_group_ids), false, 
                            "$group_arr")

                        var inner_query = _Config.es_query_finalisation(inner_query_groups)
                        es_client.search({ index: _Config.Elasticsearch_socatel_history_index, body: inner_query}, 
                            function (err, result) {
                                if (err){
                                    console.log(err.message)  
                                    return res.status(500).send([])
                                } else {
                                    try {
                                        if (result.body.aggregations.groups.buckets.length > 0) {
                                            result.body.aggregations.groups.buckets.forEach(function(bucket){
                                                // index 1 in inner aggregations bucket is for joins/subscribes and 0 is for views
                                                if (bucket.history_type.buckets.length == 2) {
                                                    pop_ratio = ((bucket.history_type.buckets[1].doc_count == 0) ? 0 : 
                                                        bucket.history_type.buckets[1].doc_count / bucket.history_type.buckets[0].doc_count) // do not divide by zero
                                                } else {
                                                    pop_ratio = 0
                                                }

                                                group_pop_ratio[bucket.key] = pop_ratio
                                            })
                                        }

                                        // JSON.stringify(group_pop_ratio, null, 2)
                                        return res.send(_Config.sort_dict_by_value(group_pop_ratio, "group_id", "popularity_ratio", true))
                                    } catch(err) {
                                        console.log(err.message)
                                        return res.status(500).send([])
                                    }
                                }
                        })
                    } catch (err) {
                        console.log(err.message)
                        return res.status(500).send([])
                    }
                }
        })
    } catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
})

app.get('/api/elasticsearch_getMostPopularGroupsByPopRatioLanguageFiltered/:timestamp_from/:timestamp_to/:language_id', basic_auth, (req, res) => {
    try {
        filtered_group_ids = []
        group_pop_ratio = {} // group and popularity ratio
    
        timestamp_from = ((req.params.timestamp_from == "undefined" || isNaN(req.params.timestamp_from)) ? 0 : req.params.timestamp_from)
        var query_from = _Config.query_body_transformation(_Config.es_filterGroupsByLanguage, 
            timestamp_from, false, "$timestamp_from")

        timestamp_to = ((req.params.timestamp_to == "undefined" || isNaN(req.params.timestamp_to)) ? new Date().getTime() : req.params.timestamp_to)
        var query_ts = _Config.query_body_transformation(query_from, timestamp_to, false, "$timestamp_to")

        var query_locality = _Config.query_body_transformation(query_ts, req.params.language_id, false, "$language_id")

        var query = _Config.es_query_finalisation(query_locality)
        es_client.search({ index: _Config.Elasticsearch_socatel_group_index, body: query}, 
            function (err, result) {
                if (err){
                    console.log(err.message)  
                    return res.status(500).send([])
                } else {
                    try {
                        // Now get the popularity ratio for each of the returned groups
                        if (result.body.hits.hits.length > 0) {
                            result.body.hits.hits.forEach(function(hit){
                                filtered_group_ids.push(hit._source.group_id)
                            })
                        }
                        
                        inner_query_groups = _Config.query_body_transformation(
                            _Config.es_getViewsAndJoinsSumsPerGivenGroup, JSON.stringify(filtered_group_ids), false, 
                            "$group_arr")

                        var inner_query = _Config.es_query_finalisation(inner_query_groups)
                        es_client.search({ index: _Config.Elasticsearch_socatel_history_index, body: inner_query}, 
                            function (err, result) {
                                if (err){
                                    console.log(err.message)  
                                    return res.status(500).send([])
                                } else {
                                    if (result.body.aggregations.groups.buckets.length > 0) {
                                        result.body.aggregations.groups.buckets.forEach(function(bucket){
                                            // index 1 in inner aggregations bucket is for joins/subscribes and 0 is for views
                                            if (bucket.history_type.buckets.length == 2) {
                                                pop_ratio = ((bucket.history_type.buckets[1].doc_count == 0) ? 0 : 
                                                    bucket.history_type.buckets[1].doc_count / bucket.history_type.buckets[0].doc_count) // do not divide by zero
                                            } else {
                                                pop_ratio = 0
                                            }

                                            group_pop_ratio[bucket.key] = pop_ratio
                                        })
                                    }

                                    // JSON.stringify(group_pop_ratio, null, 2)
                                    return res.send(_Config.sort_dict_by_value(group_pop_ratio, "group_id", "popularity_ratio", true))
                                }
                        })
                    } catch (err) {
                        console.log(err.message)
                        return res.status(500).send([])
                    }
                }
        })
    } catch (err) {
        return res.status(500).send([])
    }
})

app.get('/api/elasticsearch_getMostPopularWordsGivenGroup/:timestamp_from/:timestamp_to/:group_id/:size', basic_auth, (req, res) => {
    try {
        timestamp_from = ((req.params.timestamp_from == "undefined" || isNaN(req.params.timestamp_from)) ? 0 : req.params.timestamp_from)
        var query_from = _Config.query_body_transformation(_Config.es_getMostFrequentWordsInGroupPosts, 
            timestamp_from, false, "$timestamp_from")

        timestamp_to = ((req.params.timestamp_to == "undefined" || isNaN(req.params.timestamp_to)) ? new Date().getTime() : req.params.timestamp_to)
        var query_ts = _Config.query_body_transformation(query_from, timestamp_to, false, "$timestamp_to")

        var query_group = _Config.query_body_transformation(query_ts, req.params.group_id, false, "$group_id")

        size = ((req.params.size == "undefined" || isNaN(req.params.size)) ? _Config.Elasticsearch_default_agg_size : req.params.size)
        var query = _Config.query_body_transformation(query_group, size, false, "$size")

        var query = _Config.es_query_finalisation(query)
        es_client.search({ index: _Config.Elasticsearch_socatel_posts_index, body: query}, 
            function (err, result) {
                if (err){
                    console.log(err.message)  
                    return res.status(500).send([])
                } else {
                    try {
                        var out = []

                        if (result.body.aggregations.word_cloud.buckets.length > 0) {
                            result.body.aggregations.word_cloud.buckets.forEach(function(bucket){
                                var cur_out = {}

                                cur_out["word"] = bucket["key"]
                                cur_out["total_occurrences"] = bucket["doc_count"]

                                out.push(cur_out)
                            })
                        }

                        return res.send(out)
                    } catch (err) {
                        console.log(err.message)
                        return res.status(500).send([])
                    }
                }
        })
    } catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
})

app.post('/api/elasticsearch_getMostPopularGroupsByPopRatioThemesFiltered/:timestamp_from/:timestamp_to/:locality_id', basic_auth, (req, res) => {
    try {
        if (req.body === "undefined" || req.body.themes === "undefined" || !Array.isArray(req.body.themes)){
            throw "There is not an array of themes that is sent with the request. Abort!"
        }

        filtered_group_ids = []
        group_pop_ratio = {} // group and popularity ratio
    
        timestamp_from = ((req.params.timestamp_from == "undefined" || isNaN(req.params.timestamp_from)) ? 0 : req.params.timestamp_from)

        if (req.params.locality_id === "undefined" || isNaN(req.params.locality_id)){
            var init_query = _Config.es_filterGroupsByThemes
        } else {
            var init_query = _Config.query_body_transformation(_Config.es_filterGroupsByThemesAndLocality, req.params.locality_id, false, "$locality_id");
        }

        var query_from = _Config.query_body_transformation(init_query, timestamp_from, false, "$timestamp_from")

        timestamp_to = ((req.params.timestamp_to == "undefined" || isNaN(req.params.timestamp_to)) ? new Date().getTime() : req.params.timestamp_to)
        var query_ts = _Config.query_body_transformation(query_from, timestamp_to, false, "$timestamp_to")

        var query_themes = _Config.query_body_transformation(query_ts, req.body.themes, true, "$themes");

        var query = _Config.es_query_finalisation(query_themes)
        es_client.search({ index: _Config.Elasticsearch_socatel_group_index, body: query}, 
            function (err, result) {
                if (err){
                    console.log(err.message)  
                    return res.status(500).send([])
                } else {
                    try {
                        // Now get the popularity ratio for each of the returned groups
                        if (result.body.hits.hits.length > 0) {
                            result.body.hits.hits.forEach(function(hit){
                                filtered_group_ids.push(hit._source.group_id)
                            })
                        }
                        
                        inner_query_groups = _Config.query_body_transformation(
                            _Config.es_getViewsAndJoinsSumsPerGivenGroup, JSON.stringify(filtered_group_ids), false, 
                            "$group_arr")

                        var inner_query = _Config.es_query_finalisation(inner_query_groups)
                        es_client.search({ index: _Config.Elasticsearch_socatel_history_index, body: inner_query}, 
                            function (err, result) {
                                if (err){
                                    console.log(err.message)  
                                    return res.status(500).send([])
                                } else {
                                    try {
                                        if (result.body.aggregations.groups.buckets.length > 0) {
                                            result.body.aggregations.groups.buckets.forEach(function(bucket){
                                                // index 1 in inner aggregations bucket is for joins/subscribes and 0 is for views
                                                if (bucket.history_type.buckets.length == 2) {
                                                    pop_ratio = ((bucket.history_type.buckets[1].doc_count == 0) ? 0 : 
                                                        bucket.history_type.buckets[1].doc_count / bucket.history_type.buckets[0].doc_count) // do not divide by zero
                                                } else {
                                                    pop_ratio = 0
                                                }

                                                group_pop_ratio[bucket.key] = pop_ratio
                                            })
                                        }

                                        // JSON.stringify(group_pop_ratio, null, 2)
                                        return res.send(_Config.sort_dict_by_value(group_pop_ratio, "group_id", "popularity_ratio", true))
                                    } catch (err) {
                                        console.log(err.message)
                                        return res.status(500).send([])
                                    }
                                }
                        })
                    } catch (err) {
                        console.log(err.message)
                        return res.status(500).send([])
                    }
                }
        })
    } catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
})

app.post('/api/elasticsearch_getMostGroupsByPopRatioSkillsFiltered/:locality_id', basic_auth, (req, res) => {
    try {
        if (req.body === "undefined" || req.body.skills === "undefined" || !Array.isArray(req.body.skills)){
            throw "There is not an array of skills that is sent with the request. Abort!"
        }

        filtered_group_ids = new Set()
        group_pop_ratio = {} // group and popularity ratio

        if (req.params.locality_id === "undefined" || isNaN(req.params.locality_id)){
            var init_query = _Config.es_filterUsersBySkills
        } else {
            var init_query = _Config.query_body_transformation(_Config.es_filterUsersBySkillsAndLocality, req.params.locality_id, false, "$locality_id");
        }

        var query_skills = _Config.query_body_transformation(init_query, req.body.skills, true, "$skills");
        var query = _Config.es_query_finalisation(query_skills)
        
        es_client.search({ index: _Config.Elasticsearch_socatel_user_index, body: query}, 
            function (err, result) {
                if (err){
                    console.log(err.message)
                    return res.status(500).send([])
                } else {
                    try {
                        // Now get the popularity ratio for each of the returned groups
                        if (result.body.hits.hits.length > 0) {
                            result.body.hits.hits.forEach(
                                function(hit) {
                                    if (Object.keys(hit._source).length > 0){
                                            hit._source.groups.forEach(function(group){
                                                filtered_group_ids.add(group.group_id)  
                                            })
                                        }
                                    }
                            )
                        }
                        
                        inner_query_groups = _Config.query_body_transformation(
                            _Config.es_getViewsAndJoinsSumsPerGivenGroup, JSON.stringify(Array.from(filtered_group_ids)),
                            false, "$group_arr")

                        var inner_query = _Config.es_query_finalisation(inner_query_groups)
                        es_client.search({ index: _Config.Elasticsearch_socatel_history_index, body: inner_query}, 
                            function (err, result) {
                                if (err){
                                    console.log(err.message)  
                                    return res.status(500).send([])
                                } else {
                                    try {
                                        if (result.body.aggregations.groups.buckets.length > 0) {
                                            result.body.aggregations.groups.buckets.forEach(function(bucket){
                                                // index 1 in inner aggregations bucket is for joins/subscribes and 0 is for views
                                                if (bucket.history_type.buckets.length == 2) {
                                                    pop_ratio = ((bucket.history_type.buckets[1].doc_count == 0) ? 0 : 
                                                        bucket.history_type.buckets[1].doc_count / 
                                                        bucket.history_type.buckets[0].doc_count) // do not divide by zero
                                                } else {
                                                    pop_ratio = 0
                                                }

                                                group_pop_ratio[bucket.key] = pop_ratio
                                            })
                                        }

                                        // JSON.stringify(group_pop_ratio, null, 2)
                                        return res.send(_Config.sort_dict_by_value(group_pop_ratio, "group_id", "popularity_ratio", true))
                                    } catch(err) {
                                        console.log(err.message)
                                        return res.status(500).send([])
                                    }
                            }
                        })
                    } catch (err) {
                        console.log(err.message)
                        return res.status(500).send([])
                    }
                }
        })
    } catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
})

app.get('/api/elasticsearch_getMostActiveUsersInGroup/:group_id/:size', basic_auth, (req, res) => {
    try {
        user_activity = []

        size = ((req.params.size == "undefined" || isNaN(req.params.size)) ? _Config.Elasticsearch_default_agg_size : req.params.size)
        
        var query = _Config.query_body_transformation(_Config.es_getUserListFromGroup, req.params.group_id, false, 
            "$group_id")
    
        var query = _Config.es_query_finalisation(query)
        es_client.search({ index: _Config.Elasticsearch_socatel_group_index, body: query}, 
            function (err, result) {
                if (err){
                    console.log(err.message)
                    return res.status(500).send(user_activity)
                } else {
                    try {
                        if (result.body.hits.hits.length > 0) {  // Does the group exist?
                            user_list = []
                            
                            if (Object.keys(result.body.hits.hits[0]._source).length > 0) {
                                if (Object.keys(result.body.hits.hits[0]._source.users).length > 0) {  // Any users in the group
                                    user_list = result.body.hits.hits[0]._source.users

                                    var inner_query = _Config.query_body_transformation(_Config.es_getMostActiveUsers, user_list, true, 
                                        "$user_id_list")
                                    
                                    // var inner_query = _Config.query_body_transformation(inner_query, size, false, "$size")
                                    var inner_query = _Config.query_body_transformation(inner_query, _Config.Elasticsearch_view_history_type, false, "$es_views_type")
                                    var inner_query = _Config.query_body_transformation(inner_query, _Config.Elasticsearch_posts_history_type, false, "$es_posts_type")

                                    var inner_query = _Config.es_query_finalisation(inner_query)

                                    es_client.search({ index: _Config.Elasticsearch_socatel_history_index, body: inner_query}, 
                                        function (err, result) { 
                                            if (err){
                                                console.log(err.message)
                                                return res.status(500).send(user_activity)
                                            } else {
                                                try {
                                                    if (Object.keys(result.body.aggregations.most_active_users.buckets).length > 0) {                                                            
                                                        result.body.aggregations.most_active_users.buckets.forEach(
                                                            function(bucket){
                                                                inner = {}
                                                                inner["user_id"] = bucket["key"]
                                                                
                                                                if (bucket["history_type"]['buckets'].length > 0) {
                                                                    inner["user_views"] = bucket["history_type"]['buckets'][0]['doc_count']
                                                                } else {
                                                                    inner["user_views"] = 0 // impossible to not have views but have posts, but do this for safety
                                                                }

                                                                if (bucket["history_type"]['buckets'].length > 1) {
                                                                    inner["user_posts"] = bucket["history_type"]['buckets'][1]['doc_count']
                                                                } else {
                                                                    inner["user_posts"] = 0
                                                                }

                                                                user_activity.push(inner)
                                                        })

                                                        return res.status(200).send(user_activity.slice(0, size))
                                                    }
                                                } catch (err) {
                                                    console.log(err.message)
                                                    return res.status(500).send(user_activity.slice(0, size))
                                                }
                                            }
                                        }
                                    )}
                                }
                            } else {
                                return res.status(200).send(user_activity.slice(0, size))
                            }
                    } catch (err) {
                        console.log(err.message)
                        return res.status(500).send(user_activity.slice(0, size))
                    }
                }
            }
        )
    } catch (err) {
        console.log(err.message)
        res.status(500).send(user_activity.slice(0, size))
    }
})

app.post('/api/elasticsearch_getGroupsByKeywords/:size', basic_auth, (req, res) => {
    try {
        
        if (req.body === "undefined" || req.body.keywords === "undefined" || !Array.isArray(req.body.keywords)){
            throw "There is not an array of keywords that is sent with the request. Abort!"
        }

        size = ((req.params.size == "undefined" || isNaN(req.params.size)) ? _Config.Elasticsearch_default_agg_size : req.params.size)

        // Detect language, if it is not given.
        if (req.body.language == "undefined" || req.body.language == undefined) {
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null)            
            country = requestCountry(ip)

            if (country == false) {
                language = "en"
            } else if (country.toLowerCase() in allowed_langs) {
                language = country
            } else {
                language = "en"
            }
        } else {
            language = req.body.language
        }

        corpus_doc_names = []
        corpus_docs = []

        // Insert given keywords to query formulation.
        should_clause = []
        req.body.keywords.forEach(function(keyword){
            // q =  _Config.query_body_transformation(_Config.es_fuzzy_group_description_search, keyword, false, "$keyword")
            q_ =  _Config.query_body_transformation(_Config.es_fuzzy_search_theme_and_group_name, keyword, false, "$keyword")
            q_ =  _Config.query_body_transformation(q_, 10, false, "$boost_factor")  // Boost actual keyword(s) by a large factor
            q_ =  _Config.query_body_transformation(q_, parseInt("lens".length/3), false, "$fuzziness")
                
            should_clause.push(q_)
            // should_clause.push(q)
        })
        
        if (req.body.locality_id != "undefined" && req.body.locality_id != undefined) {
            q =  _Config.query_body_transformation(_Config.es_locality_match, req.body.locality_id, false, 
                "$locality_id")
            should_clause.push(q)
        }

        // Collect and insert synonyms too.
        // We need a GraphQL query to do this. Alternative: Get frequent keywords from related tweets
        var tw_query = _Config.query_body_transformation(_Config.graphql_twSearchByTopics, req.body.keywords, true, "$topics")
        var tw_query = _Config.query_body_transformation(tw_query, language, false, "$language")
        
        client.request(tw_query).then(function(data) {
            data['postsByTopics'].forEach((doc, i) => {
                // Do some cleaning of tweets
                clean_descr = doc['description'].replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');

                // Add to corpus
                corpus_doc_names.push("doc_" + i)
                corpus_docs.push(clean_descr)
            })

            const corpus = new tinyTfidfNode.Corpus(corpus_doc_names, corpus_docs)

            unqTerms = corpus.getTerms();

            term_weights = {}
            unqTerms.forEach(function(term) {
                term_weights[term] = corpus.getCollectionFrequencyWeight(term)
            });

            term_weights_sorted = _Config.sort_dict_by_value(term_weights, "term", "freqScore", false).slice(0, _Config.top_keywords_size_from_twitter)
            Object.values(term_weights_sorted).forEach(function(value){
                // Apply on all fields, with a small boost factor across
                q_ =  _Config.query_body_transformation(_Config.es_fuzzy_search_all_fields, value['term'], false, "$keyword")
                q_ =  _Config.query_body_transformation(q_, 2, false, "$boost_factor")
                
                // should_clause.push(q_)
            })

            // Assemble full query
            var query = _Config.query_body_transformation(_Config.es_getGroupFromKeywords, should_clause, false, 
                "$should_clause")

            query = _Config.query_body_transformation(query, size, false, "$size")
            query = _Config.query_body_transformation(query, language, false, "$language_code")

            es_client.search({ index: _Config.Elasticsearch_socatel_group_index, body: query}, function (err, result) {
                if (err){
                    console.log(err.message)  
                    return res.status(500).send([])
                } else {
                    group_info = result.body.hits.hits
                    group_res = []

                    group_info.forEach(function(group){
                        inner_group_res = {}
                        inner_group_res['group_id'] = group['_source']['group_id']
                        inner_group_res['score'] = group['_score']
                        group_res.push(inner_group_res)
                    })

                    return res.status(200).send(group_res)
                }
            })
        });

    } catch (err) {
        console.log(err.message)
        res.status(500).send([])
    }
})

app.post('/api/elasticsearch_getServicesByKeywords/:size', basic_auth, (req, res) => {
    try {
        
        if (req.body === "undefined" || req.body.keywords === "undefined" || !Array.isArray(req.body.keywords)){
            throw "There is not an array of keywords that is sent with the request. Abort!"
        }

        size = ((req.params.size == "undefined" || isNaN(req.params.size)) ? _Config.Elasticsearch_default_agg_size : req.params.size)

        // Detect language, if it is not given.
        if (req.body.language == "undefined" || req.body.language == undefined) {
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null)            
            country = requestCountry(ip)

            if (country == false) {
                language = "en"
            } else if (country.toLowerCase() in allowed_langs) {
                language = country
            } else {
                language = "en"
            }
        } else {
            language = req.body.language
        }

        corpus_doc_names = []
        corpus_docs = []

        // Insert given keywords to query formulation.
        should_clause = []
        req.body.keywords.forEach(function(keyword){
            // q =  _Config.query_body_transformation(_Config.es_fuzzy_group_description_search, keyword, false, "$keyword")
            q_ =  _Config.query_body_transformation(_Config.es_fuzzy_search_theme_and_service_name, keyword, false, "$keyword")
            q_ =  _Config.query_body_transformation(q_, 10, false, "$boost_factor")  // Boost actual keyword(s) by a large factor
            q_ =  _Config.query_body_transformation(q_, parseInt("lens".length/3), false, "$fuzziness")
                
            should_clause.push(q_)
            // should_clause.push(q)
        })
        
        // if (req.body.locality_id != "undefined" && req.body.locality_id != undefined) {
        //     q =  _Config.query_body_transformation(_Config.es_locality_match, req.body.locality_id, false, 
        //         "$locality_id")
        //     should_clause.push(q)
        // }

        // Collect and insert synonyms too.
        // We need a GraphQL query to do this. Alternative: Get frequent keywords from related tweets
        var tw_query = _Config.query_body_transformation(_Config.graphql_twSearchByTopics, req.body.keywords, true, "$topics")
        var tw_query = _Config.query_body_transformation(tw_query, language, false, "$language")
        
        client.request(tw_query).then(function(data) {
            data['postsByTopics'].forEach((doc, i) => {
                // Do some cleaning of tweets
                clean_descr = doc['description'].replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');

                // Add to corpus
                corpus_doc_names.push("doc_" + i)
                corpus_docs.push(clean_descr)
            })

            const corpus = new tinyTfidfNode.Corpus(corpus_doc_names, corpus_docs)

            unqTerms = corpus.getTerms();

            term_weights = {}
            unqTerms.forEach(function(term) {
                term_weights[term] = corpus.getCollectionFrequencyWeight(term)
            });

            term_weights_sorted = _Config.sort_dict_by_value(term_weights, "term", "freqScore", false).slice(0, 
                _Config.top_keywords_size_from_twitter)
            Object.values(term_weights_sorted).forEach(function(value){
                // Apply on all fields, with a small boost factor across
                q_ =  _Config.query_body_transformation(_Config.es_fuzzy_search_all_fields, value['term'], false, "$keyword")
                q_ =  _Config.query_body_transformation(q_, 2, false, "$boost_factor")
                
                // should_clause.push(q_)
            })

            // Assemble full query
            var query = _Config.query_body_transformation(_Config.es_getGroupFromKeywords, should_clause, false, 
                "$should_clause")

            query = _Config.query_body_transformation(query, size, false, "$size")
            query = _Config.query_body_transformation(query, language, false, "$language_code")

            es_client.search({ index: _Config.Elasticsearch_socatel_service_index, body: query}, function (err, result) {
                if (err){
                    console.log(err.message)  
                    return res.status(500).send([])
                } else {
                    service_info = result.body.hits.hits
                    service_res = []

                    service_info.forEach(function(service){
                        inner_service_res = {}
                        inner_service_res['service_id'] = service['_source']['service_id']
                        inner_service_res['locality_id'] = service['_source']['locality']['locality_id']
                        inner_service_res['score'] = service['_score']
                        service_res.push(inner_service_res)
                    })

                    return res.status(200).send(service_res)
                }
            })
        });

    } catch (err) {
        console.log(err.message)
        res.status(500).send([])
    }
})

// // ---- DAI

app.get('/api/get_group_average_sentiment_score/:date_from/:date_to/:group_id', basic_auth, (req, res) => {
	try {
		if (req.body.date_from === "undefined" || req.body.date_from === '' && req.body.date_from === null || req.body.date_from === undefined){
			date_from = new Date('1970-01-01', )
			date_from.setHours(0,0,0,0); // set at the start of the day to include all of it.
		} else {
			date_from = new Date(req.params.date_from)
		}

		if (req.body.date_to === "undefined" || req.body.date_to === '' && req.body.date_to === null || req.body.date_to === undefined){
			date_to = new Date()
			date_to.setHours(23,59,59,0); // set at the last minute of the day to include all of it
		} else {
			date_to = new Date(req.params.date_to)
		}

		MongoClient.connect(mongo_url, { useNewUrlParser: true }, (err, client) => {
			if (err) return res.status(500).send([])

			const gtg_db = client.db(_Config.MongoDB_GeneralSentiment_db);
			var sim_selector = {
				"group_id": req.params.group_id,
				"date_from": {'$gte': date_from}, 
				"date_to": {'$lte': date_to}
			}

			out = {}
			gtg_db.collection(_Config.MongoDB_GeneralSentiment_lr_collection).find(sim_selector).toArray(function(err, result) {
				if (result.length > 0) {
					var total = result.reduce((x,y) => x + y.no_of_posts, 0)
					var average_score = result.reduce((x,y) => x + y.no_of_posts * (y.avg_sentiment_score / total), 0)
					
					return res.status(200).send({
						'group_id': parseInt(req.params.group_id),
						'average_sentiment_score': average_score,
						'total_posts': total
					})
				}
				
				return res.status(200).send(result)
			})

		})
	} catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
});

// app.get('/api/get_sentiment_given_free_text/:free_text/:language_code', basic_auth, (req, res) => {
//     if (_Config.sentiment_url_mapping[req.params.language_code] === null) {
//         return res.status(200).send({
//             "category": null,
//             "confidence": null
//         })
//     }

//     var reco_request = {"text": req.params.free_text}

//     request.post({
//         'url': _Config.sentiment_url_mapping[req.params.language_code],
//         'headers': { 
//             'Content-Type': 'application/json',
//             'Access-Control-Allow-Origin': "*",
//             "Access-Control-Allow-Methods": "*"
//         },
//         body: JSON.stringify(reco_request)  
//     }, function(err, resp){
//         if (err){
//             console.log(err)
//             return res.status(500).send({
//                 "category": null,
//                 "confidence": null
//             })
//         }
        
//         return resp
//     })
// })

// ---- DSE API endpoints


app.post('/api/insert_new_socatel_user', basic_auth, (req, res) => {
    try {
        var options = {
            'method': 'POST',
            'url': _Config.DSE_flask_app_url + _Config.DSE_flask_app_soca_user_endpoint,
            'headers': {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(req.body)
        };

        request(options, function (error, response) { 
            if (error) res.status(500).send({"status": 500, "message": "Error inserting socatel user. Contact the Administrator"});
            try { 
                res.status(200).send(response.body)
            } catch (err) {
                console.log(err.message)
                return res.status(500).send({"status": 500, "message": "Error inserting socatel user. Contact the Administrator"})
            }
        })
    } catch (err) {
        console.log(err.message)
        return res.status(500).send({"status": 500, "message": "Error inserting socatel user. Contact the Administrator"})
    }
});

app.post('/api/insert_new_socatel_group', basic_auth, (req, res) => {
    try {
        var options = {
            'method': 'POST',
            'url': _Config.DSE_flask_app_url + _Config.DSE_flask_app_soca_group_endpoint,
            'headers': {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(req.body)
        };

        request(options, function (error, response) { 
            if (error) res.status(500).send({"status": 500, "message": "Error inserting socatel group. Contact the Administrator"});
            try { 
                res.status(200).send(response.body)
            } catch (err) {
                console.log(err.message)
                return res.status(500).send({"status": 500, "message": "Error inserting socatel group. Contact the Administrator"})
            }
        });
    } catch (err) {
        console.log(err.message)
        return res.status(500).send({"status": 500, "message": "Error inserting socatel group. Contact the Administrator"})
    }
});

app.post('/api/insert_new_socatel_organisation', basic_auth, (req, res) => {
    try {
        var options = {
            'method': 'POST',
            'url': _Config.DSE_flask_app_url + _Config.DSE_flask_app_soca_organisation_endpoint,
            'headers': {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(req.body)
        };

        request(options, function (error, response) {
            if (error) res.status(500).send({"status": 500, "message": "Error inserting socatel organisation. Contact the Administrator"});
            try { 
                res.status(200).send(response.body)
            } catch (err) {
                console.log(err.message)
                return res.status(500).send({"status": 500, "message": "Error inserting socatel organisation. Contact the Administrator"})
            }
        });
    } catch (err) {
        console.log(err.message)
        return res.status(500).send({"status": 500, "message": "Error inserting socatel organisation. Contact the Administrator"})
    }
});

app.post('/api/insert_new_socatel_service', basic_auth, (req, res) => {
    try {
        var options = {
            'method': 'POST',
            'url': _Config.DSE_flask_app_url + _Config.DSE_flask_app_soca_service_endpoint,
            'headers': {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(req.body)
        };

        request(options, function (error, response) { 
            if (error) res.status(500).send({"status": 500, "message": "Error inserting socatel service. Contact the Administrator"});
            try {
                res.status(200).send(response.body)
            } catch (err) {
                console.log(err.message)
                return res.status(500).send({"status": 500, "message": "Error inserting socatel service. Contact the Administrator"})
            }
        });
    } catch (err) {
        console.log(err.message)
        return res.status(500).send({"status": 500, "message": "Error inserting socatel service. Contact the Administrator"})
    }
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(_Config.restapi_port, () =>
  console.log(`SoCaTel REST API Layer listens on port ${_Config.restapi_port}!`),
);