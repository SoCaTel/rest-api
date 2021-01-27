const Config = {
    PIO_default_arr_result_size: 5,

    GraphQL_Endpoint : "<insert_graphql_endpoint_url>",  // e.g. "http://127.0.0.1:8080/graphql",
    GraphQL_Authorisation : "<insert_authentication_token>",  // Typically following the "Basic" HTTP authentication scheme
    
    Elasticsearch_Endpoint: "<insert_elasticsearch_endpoint_for_queries>",  // e.g. http://127.0.0.1:9200/
    Elasticsearch_Authorisation : "<insert_authentication_token>",  // Typically following the "Basic" HTTP authentication scheme
    
    // The following are the pre-defined names of elasticsearch indices for the SoCaTel project.
    Elasticsearch_default_agg_size: 10,  // Maximum number of returned results by Elasticsearch queries
    Elasticsearch_socatel_history_index: 'so_history',
    Elasticsearch_socatel_posts_index: 'so_post',
    Elasticsearch_socatel_user_index: 'so_user',
    Elasticsearch_socatel_group_index: 'so_group',
    Elasticsearch_socatel_service_index: 'so_service',
    Elasticsearch_post_likes_field_name: 'post_upvotes',
    Elasticsearch_post_dislikes_field_name: 'post_downvotes',
    Elasticsearch_post_timestamp_field_name: 'post_timestamp',
    Elasticsearch_view_history_type: 7,
    Elasticsearch_join_history_type: 5,
    Elasticsearch_posts_history_type: 4,

    // The configurations correspond to the flask component used to synchronise data insertions to Elasticsearh and GraphDB.
    DSE_flask_app_url: "<insert_dse_flask_app_url>",  // e.g. "http://127.0.0.1:56733"
    DSE_flask_app_soca_user_endpoint: "/etl/insert_new_soca_user",
    DSE_flask_app_soca_group_endpoint: "/etl/insert_new_soca_group",
    DSE_flask_app_soca_organisation_endpoint: "/etl/insert_new_soca_organisation",
    DSE_flask_app_soca_service_endpoint: "/etl/insert_new_soca_service",

    top_keywords_size_from_twitter: 5,  // Maximum number of returned results by the GraphQL twitter-based queries

    MongoDB_default_arr_result_size: 10,  // Maximum number of returned results by the MongoDB queries
    
    MongoDB_Host: '<insert_host_name>', // e.g. 'localhost' or a docker instance's name
    MongoDB_Port: '27017',  // default MongoDB port, change as necessary
    MongoDB_Username: 'default_username',
    MongoDB_Password: 'default_password',

    // The following are pre-defined collection names for the stored sentiment score results that the sentiment classification engine will issue.
    MongoDB_GeneralSentiment_db: 'group_sentiment',
    MongoDB_GeneralSentiment_lr_collection: 'general.linear_regression',

    // Setup username/password authentication for this node.js instance
    restapi_username: '<insert_restapi_username>',  // this is up to the developer
    restapi_password: '<insert_restapi_password>',  // this is up to the developer
    restapi_port: 8192,  // this is up to the developer. If changed, also change in the Dockerfile as well

    sentiment_url_mapping: {
      "en": "<insert_sentiment_classification_engine_url>",  // "http://localhost:8000/queries.json"
      "es": null,
      "fi": null,
      "hu": null
    },
    graphql_multiplePostsByTopics: `{
        searchByTopics(topics: [$topics], language: "$language") {
            identifier
            webLink            
        }   
    }`,
    graphql_twSearchByTopics: `{
        postsByTopics(topics: [$topics], language: "$language") {
            identifier
            description
            creationDate
            language
            numLikes
            numReplies
            owner {
                imageLink
            }
            creator {
                name
                username
            }
        }   
    }`,
    graphql_postsById: `{
        postById(identifier: "$identifier") {
            description
            creationDate
            language
            numLikes
            numReplies
            topics            
            location {
                name
                alternateName
                countryCode
            }
            owner {
                identifier
                title
                description
                webLink
                imageLink
                language
                numLikes
            }
            creator {
                name
                username
            }
        }
    }`,
    graphql_search_for_posts: `{
        posts(limit: $limit) {
            identifier
            description
            creationDate
            language
            numLikes
            numReplies
            location {
                name
                alternateName
                countryCode
            }
            owner {
                identifier
                title
                description
                webLink
                imageLink
                language
                numLikes
            }
            creator {
                name
                username
            }
            topics
        }
    }`,
    graphql_introspect_post_type: `
    {
        __type(name: "Post") {
            name
            fields {
                name
                type {
                    name
                    kind
                }
            }
        }
    }`,
    graphql_service_by_id: `
    {
        service(identifier: $id) {
            identifier
            title
            description
            language
            webLink
            creator {
                name
            }
            location {
                name
            }
        }
    }`,  
    graphql_service_by_offset: `
    {
        services(offset: $from, limit: $to) {
            identifier
            title
            description
            language
            webLink
            creator {
                name
            }
            location {
                name
            }
        }
    }`,
    graphql_services_by_topics: `
    {
        servicesByTopics(topics: [$topics], language: "$language", offset: $from, limit: $to) {
            identifier
            title
            description
            language
            webLink
            creator {
                name
            }
            location {
                name
            }
      }
    }
    `,
    es_getMostPostedInGroups: `
    { 
        "size": 0,
        "query": {
            "range": {
                "post_timestamp": {
                    "gte": $timestamp_from,
                    "lte": $timestamp_to
                }
            }
        }, 
        "aggs": {
            "posts_in_groups": {
                "terms": {
                "field": "group_id",
                "size": $size,
                "order" : { "_count" : "desc" }
                }
            }
        }   
    }`,
    es_getPostStatsPerGroupAndTimeframe:`
    {
        "size": 0,
        "query": {
            "range": {
                "post_timestamp": {
                    "gte": $timestamp_from,
                    "lte": $timestamp_to
                }
            }
        },
        "aggs": {
            "totals": {
              "terms": {
                "field": "group_id",
                "size": 10,
                "order" : { "_count" : "desc" }
            },
            "aggs": {
              "facets": {
                "stats": {
                    "field": "$field_name"
                }
              },
              "unique_users": {
                "cardinality": {
                  "field": "author_user_id.keyword"
                }
              }
            }
          }
        }
    }`,
    es_getUserDemographicsGivenGroup:`
    {
        "size": 0,
        "query": {
            "match": {
                "groups.group_id": $group_id
            }
        },
        "aggs": {
            "skills_demographics": {
                "terms": {
                    "field": "skills.skill_id"
                }
            },
            "themes_demographics": {
                "terms": {
                    "field": "themes.theme_id"
                }
            },
            "primary_lang_demographics": {
                "terms": {
                    "field": "primary_language.language_id"
                }
            },
            "sec_lang_demographics": {
                "terms": {
                    "field": "secondary_language.language_id"
                }
            },
            "locality_demographics": {
                "terms": {
                    "field": "locality.locality_id"
                }
            },
            "locality_parent_demographics": {
                "terms": {
                    "field": "locality_parent.locality_id"
                }
            }
        }
    }`,
    es_getGroupCategorisationStats: `
    {
        "size": 0,
        "aggs": {
            "popular_themes": {
                "terms": {
                    "size": $size,
                    "field": "themes.theme_id"
                }
            }
        }
    }`,
    es_filterGroupsByLocality:`{
      "_source": ["group_id"],
        "size": 25,
        "query": {
          "bool": {
            "must": [
              {
                "bool": {
                  "should": [
                    {
                      "match": {
                        "locality.locality_id": $locality_id
                      }
                    },
                    {
                      "match": {
                        "locality.locality_parent.locality_id": $locality_id
                      }
                    }
                  ],
                  "minimum_should_match": 1
                }
              },
              {
                "range": {
                  "group_create_time": {
                    "gte": $timestamp_from,
                    "lte": $timestamp_to
                  }
                }
              }
            ]
          }
        }
    }`,
    es_filterGroupsByLocalityAndLanguage:`{
      "_source": ["group_id"],
        "size": 25,
        "query": {
          "bool": {
            "must": [
              {
                "match": {
                  "language.language_id": $language_id
                }
              },
              {
                "bool": {
                  "should": [
                    {
                      "match": {
                        "locality.locality_id": $locality_id
                      }
                    },
                    {
                      "match": {
                        "locality.locality_parent.locality_id": $locality_id
                      }
                    }
                  ],
                  "minimum_should_match": 1
                }
              },
              {
                "range": {
                  "group_create_time": {
                    "gte": $timestamp_from,
                    "lte": $timestamp_to
                  }
                }
              }
            ]
          }
        }
    }`,
    es_filterGroupsByLanguage: `{
        "_source": ["group_id"],
        "size": 25,
        "query": {
            "bool": {
            "must": [
                {
                    "match": {
                        "language.language_id": $language_id
                    }
                },
                {
                    "range": {
                        "group_create_time": {
                            "gte": $timestamp_from,
                            "lte": $timestamp_to
                        }
                    }
                }
            ]
            }
        }
    }`,
    es_filterGroupsByThemes:`
    {
        "_source": ["group_id"],
        "size": 25,
        "query": {
            "bool": {
                "filter": {
                    "terms": {
                        "themes.theme_name.keyword": [$themes]
                    }
                },
                "must": [
                {
                    "range": {
                        "group_create_time": {
                            "gte": $timestamp_from,
                            "lte": $timestamp_to
                        }
                    }
                }
                ]
            }
        }
    }`,
    es_filterGroupsByThemesAndLocality:`
    {
      "_source": ["group_id"],
      "size": 25,
      "query": {
          "bool": {
              "filter": {
                  "terms": {
                      "themes.theme_name.keyword": [$themes]
                  }
              },
              "must": [
              {
                  "range": {
                      "group_create_time": {
                          "gte": $timestamp_from,
                          "lte": $timestamp_to
                      }
                  }
              },
              {
                "bool": {
                  "should": [
                    {
                      "match": {
                        "locality.locality_id": $locality_id
                      }
                    },
                    {
                      "match": {
                        "locality.locality_parent.locality_id": $locality_id
                      }
                    }
                  ]
                }
              }
              ]
          }
      }
    }`,
    es_filterUsersBySkills:`{
        "size": 100,
        "_source": ["groups.group_id"],
        "query": {
            "bool": {
                "filter": {
                    "terms": {
                        "skills.skill_name.keyword": [$skills]
                    }
                }
            }
        }
    }`,
    es_filterUsersBySkillsAndLocality:`{
        "size": 100,
        "_source": ["groups.group_id"],
        "query": {
            "bool": {
                "filter": {
                    "terms": {
                        "skills.skill_name.keyword": [$skills]
                    }
                },
                "must": {
                  "bool": {
                  "should": [
                    {
                      "match": {
                        "locality.locality_id": $locality_id
                      }
                    },
                    {
                      "match": {
                        "locality.locality_parent.locality_id": $locality_id
                      }
                    }
                  ],
                  "minimum_should_match": 1
                }
              }
            }
        }
    }`,
    es_getViewsAndJoinsSumsPerGivenGroup:`{
        "query": {
            "bool": {
              "filter": {
                "terms": {
                  "group_id": $group_arr
                }
              },
              "must": [
                {
                  "bool": {
                    "should": [
                      {
                        "match": {
                          "history_type": 5
                        }
                      },
                      {
                        "match": {
                          "history_type": 7
                        }
                      }
                    ],
                    "minimum_should_match": 1
                  }
                }
              ]
            }
          },
          "aggs": {
            "groups": {
              "terms": {
                "field": "group_id"
              },
              "aggs": {
                "history_type": {
                  "terms": {
                    "field": "history_type"
                  }
                }
              }
            }
          }
    }`,
    es_getViewsAndJoinsSumsAllGroups:`{
        "size": 0,
        "query": {
            "bool": {
              "must": [
                {
                  "bool": {
                    "should": [
                      {
                        "match": {
                          "history_type": 5
                        }
                      },
                      {
                        "match": {
                          "history_type": 7
                        }
                      }
                    ],
                    "minimum_should_match": 1
                  }
                },
                {
                  "range": {
                      "history_timestamp": {
                          "gte": $timestamp_from,
                          "lte": $timestamp_to
                      }
                  }
                }
              ]
            }
          },
          "aggs": {
            "groups": {
              "terms": {
                "field": "group_id",
                "size": $size
              },
              "aggs": {
                "history_type": {
                  "terms": {
                    "field": "history_type"
                  }
                }
              }
            }
          }
    }`,
    es_getMostFrequentWordsInGroupPosts: `{
      "size": 0,
      "query": {
        "bool": {
          "must": [
            {
              "range": {
                "post_timestamp": {
                  "gte": $timestamp_from,
                  "lte": $timestamp_to
                }
              }
            },
            {
              "match": {
                "group_id": $group_id 
              }  
            }
          ]
          }
      },
      "aggs": {
        "word_cloud": {
          "terms": {
            "field": "post_text",
            "size": $size
          }
        }
      }
    }`,
    es_getUserListFromGroup: `{
      "_source": "users",
      "query": {
        "match": {
          "group_id": $group_id
        }
      }
    }`,
    es_getMostActiveUsersFromList: `{
      "size": 0,
      "query": {
        "bool": {
          "filter": {
            "terms": {
              "user_id": [$user_id_list]
            }
          }
        }
      },
      "aggs": {
        "most_active_users": {
          "terms": {
            "size": $size,
            "field": "user_id.keyword",
            "order" : { "_count" : "desc" }
          },
          "aggs": {
            "history_type": {
              "terms": {
                "field": "history_type"
              }
            }
          }
        }
      }  
    }`,
    es_getMostActiveUsers: `{
      "size": 0,
      "query": {
        "bool": {
          "filter": {
            "bool": {
              "must": [
                {
                  "terms": {
                    "user_id": [$user_id_list]
                  }
                },
                {
                  "terms": {
                    "history_type": [$es_views_type, $es_posts_type]
                  }
                }
              ]
            }
          }
        }
      },
      "aggs": {
        "most_active_users": {
          "terms": {
            "size": 10,
            "field": "user_id.keyword",
            "order": {
              "_count": "desc"
            }
          },
          "aggs": {
            "history_type": {
              "terms": {
                "field": "history_type",
                "order": {
                  "_key": "desc"
                }
              }
            }
          }
        }
      }
    }`,
    es_fuzzy_group_description_search: `{
      "fuzzy": {
        "group_description": {
          "value": "$keyword"
        }
      }
    }`,
    /* 
    best_fields is most useful when searching for multiple words best found in the same field. This would be the case for the group name field. 
    For single keywords, it can try both fields and get the best matching one. Add tie breaker so that results from the less useful field gets calculated
    at the rate specified.
    */
    es_fuzzy_search_theme_and_service_name: `{
      "multi_match": {
          "query": "$keyword",
          "type": "best_fields",
          "fields": [
              "themes.theme_name",
              "service_name",
              "service_description",
              "native_service_description",
              "service_website",
              "service_hashtag"
          ],
          "tie_breaker": 0.3,
          "boost": $boost_factor,
          "fuzziness": $fuzziness
      }
    }`,
    es_fuzzy_search_theme_and_group_name: `{
      "multi_match": {
          "query": "$keyword",
          "type": "best_fields",
          "fields": [
              "themes.theme_name",
              "group_name",
              "group_description"
          ],
          "tie_breaker": 0.3,
          "boost": $boost_factor,
          "fuzziness": $fuzziness
      }
    }`,
    es_fuzzy_search_all_fields: `{
      "multi_match": {
          "query": "$keyword",
          "type": "best_fields",
          "fields": [
              "themes.theme_name",
              "group_name",
              "group_description"
          ],
          "tie_breaker": 0.3,
          "boost": $boost_factor,
          "fuzziness": 5
      }
    }`,
    es_locality_match: `{
      "bool": {
        "should": [
          {
            "match": {
              "locality.locality_id": $locality_id
            }
          },
          {
            "match": {
              "locality.locality_parent.locality_id": $locality_id
            }
          }
        ],
        "minimum_should_match": 1
      }
    }`,
    es_getGroupFromKeywords: `{
      "size": $size,
      "query": {
        "bool": {
          "must": [
            {
              "match_phrase": {
                "language.language_code": "$language_code"
              }
            }
          ],
          "should": [$should_clause],
          "minimum_should_match": 1
        }
      }
    }`,
    query_body_transformation: function(str, to_replace, is_array, replace_identifier){
        if (!is_array){
            // replace all occurrences
            return str.split(replace_identifier).join(`${to_replace}`) 
        } else {
            if (!Array.isArray(to_replace)){
                throw 'to_replace is not an array';
            }

            var to_return = '';
            for(var i = 0; i < to_replace.length; i++){
                if (i !== to_replace.length -1){
                    to_return = `${to_return}"${to_replace[i]}",`;
                }
                else {
                    to_return = `${to_return}"${to_replace[i]}"`;
                }
            } 
            return str.replace(replace_identifier, to_return);           
        }
    },
    sort_dict_by_value: function(dict, key_name, val_name, key_as_int=false){
        var items = Object.keys(dict).map(function(key) {
            return [key, dict[key]];
        });
          
        // Sort the array based on the second element
        items.sort(function(first, second) {
            return second[1] - first[1];
        });

        var out = []
        items.forEach(function(item){
            var cur_out = {}

            cur_out[key_name] = key_as_int ? parseInt(item[0]) : item[0]
            cur_out[val_name] = item[1]

            out.push(cur_out)
        })

        return out
    },
    es_query_finalisation: function(str){
        return JSON.parse(str)
    }
}

module.exports = Config;