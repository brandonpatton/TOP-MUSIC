const express = require('express');
const router = express.Router();
const data = require('../data');
const uuid = require('uuid');
const moment = require('moment');
const jwt = require('jsonwebtoken');

router.post("/createNewThread", async (req, res) => {
    try {
        if (!req.body.title) {
            res.render("threads/myThread", { layout: "main", error_message: "Please provide forum title." })
        } else if (!req.body.user_id) {
            res.render("threads/myThread", { layout: "main", error_message: "Please provide user information." })
        } else {
            let threadData = {
                _id: uuid.v4(),
                title: req.body.title,
                comment: (req.body.comment) ? req.body.comment : "",
                createdDate: moment(new Date()).format("DD/MM/YYYY HH:mm:ss"),
                lastUpdatedDate: moment(new Date()).format("DD/MM/YYYY HH:mm:ss"),
                userId: req.body.user_id,
                likeCount: 0,
                commentCount: 0,
                genres: req.body.genres_ids,
                artist: req.body.artist_ids
            }

            let insertThread = await data.threads.AddThread(threadData);
            let getThreadData = await data.threads.GetAllUserThreads(req.body.user_id);
            let user_data = await data.users.GetUserById(req.body.user_id);
            let thread_ids = getThreadData.map(x => x._id);
            let getsubThreadData = await data.threads.GetSubThread(thread_ids);
            let getLikeData = await data.threads.getThreadLikeWise(thread_ids, req.body.user_id);
            let artist_data = await data.artists.GetAllArtists();
            let genre_data = await data.genres.GetAllGenres();
            getThreadData.forEach(element => {
                getLikeData.forEach(lelement => {
                    if (element._id == lelement.threadId && element.userId == req.body.user_id) {
                        element["userlike"] = 1
                    }
                });
                element["subThread"] = [];
                getsubThreadData.forEach(selement => {
                    if (element._id == selement.threadId) {
                        element["subThread"].push(selement)
                    }
                });
            })
            getThreadData.forEach( async (element) => {
                element["fullName"] = user_data.fullName;
                element["profileLogo"] = user_data.profileLogo;
                
                // if (element.genres != ""){
                //     let genre_tag = await data.genres.GetGenresById(element.genres);
                //     element.genres = genre_tag.genreName;
                // }
                // if (element.artist != ""){
                //     let artist_tag = await data.artists.GetArtistsById(element.artist);
                //     element.artist = artist_tag.artistName;
                // }
                
                   
            });
            
            res.render("threads/myThread", { layout: "main", threadData: getThreadData, auth: req.session.auth, userID: req.body.user_id, artist_data: artist_data, genre_data: genre_data })

        }
    } catch (e) {
        res.status(401).redirect('/');
    }
});

router.get("/likeDislikeThread/:thread_id/:user_id", async (req, res) => {
    try {
        if (!req.params.user_id) {
            res.render("threads/myThread", { layout: "main", error_message: "Please provide user information." })
        } else {
            let threadData = await data.threads.getThreadByLike(req.params.thread_id, req.params.user_id);
            if (threadData == null) {
                let ThreadData = {
                    threadId: req.params.thread_id,
                    userId: req.params.user_id,
                    _id: uuid.v4()
                }
                let addLike = await data.threads.addThreadLike(ThreadData);
                res.json({ likeCount: 1, count: addLike })
            } else {
                let removeLike = await data.threads.removeThreadLike(req.params.thread_id, req.params.user_id)
                res.json({ likeCount: 0, count: removeLike });
            }
        }
    } catch (e) {
        res.status(401).redirect('/');
    }
});

router.post("/UpdateThread", async (req, res) => {
    try {
        if (!req.body.title) {
            res.render("threads/myThread", { layout: "main", error_message: "Please provide forum title." })
        } else if (!req.body.user_id) {
            res.render("threads/myThread", { layout: "main", error_message: "Please provide user information." })
        } else {
            let threadData = {
                title: req.body.title,
                comment: (req.body.comment) ? req.body.comment : "",
                // media: (req.body.media) ? req.body.media : "",
                lastUpdatedDate: moment(new Date()).format("DD/MM/YYYY HH:mm:ss"),
                genres: req.body.genres_ids,
                artist: req.body.artist_ids
            }
            
            let updateThread = await data.threads.UpdateThread(threadData, req.body.thread_id);
            let getThreadData = await data.threads.GetAllUserThreads(req.body.user_id);
            let user_data = await data.users.GetUserById(req.body.user_id);
            let thread_ids = getThreadData.map(x => x._id);
            let getsubThreadData = await data.threads.GetSubThread(thread_ids);
            let getLikeData = await data.threads.getThreadLikeWise(thread_ids, req.body.user_id);
            let artist_data = await data.artists.GetAllArtists();
            let genre_data = await data.genres.GetAllGenres();

            getThreadData.forEach(async (element) => {
                if (element.genres != ""){
                    let genre_tag = await data.genres.GetGenresById(element.genres);
                    element.genres = genre_tag.genreName;
                }
                if (element.artist != ""){
                    let artist_tag = await data.artists.GetArtistsById(element.artist);
                    console.log(artist_tag.artistName)
                    element.artist = artist_tag.artistName;
                }
                    
                // } else if (element.genres != "") {
                //     let genre_tag = await data.genres.GetGenresById(element.genres);
                //     element.genres = genre_tag.genreName;
                // } else {
                //     let artist_tag = await data.artists.GetArtistsById(element.artist);
                //     element.artist = artist_tag.artistName;
                // }
                
                getLikeData.forEach(lelement => {
                    if (element._id == lelement.threadId && element.userId == req.body.user_id) {
                        element["userlike"] = 1
                    }
                });
                element["subThread"] = [];
                getsubThreadData.forEach(selement => {
                    if (element._id == selement.threadId) {
                        element["subThread"].push(selement)
                    }
                });
            });
            getThreadData.forEach(element => {
                element["fullName"] = user_data.fullName;
                element["profileLogo"] = user_data.profileLogo;
            });
            res.render("threads/myThread", { layout: "main", threadData: getThreadData, auth: req.session.auth, userID: req.body.user_id, artist_data: artist_data, genre_data: genre_data })
        }
    } catch (e) {
        res.status(401).redirect('/');
    }
});

router.get("/DeleteThread/:thread_id/:user_id", async (req, res) => {
    try {
        let deleteThread = await data.threads.DeleteThread(req.params.thread_id);
        let getThreadData = await data.threads.GetAllUserThreads(req.params.user_id);
        let user_data = await data.users.GetUserById(req.params.user_id);
        let thread_ids = getThreadData.map(x => x._id);
        let getsubThreadData = await data.threads.GetSubThread(thread_ids);
        let getLikeData = await data.threads.getThreadLikeWise(thread_ids, req.params.user_id);
        let artist_data = await data.artists.GetAllArtists();
        let genre_data = await data.genres.GetAllGenres();
        getThreadData.forEach(element => {
            getLikeData.forEach(lelement => {
                if (element._id == lelement.threadId && element.userId == req.params.user_id) {
                    element["userlike"] = 1
                }
            });
            element["subThread"] = [];
            getsubThreadData.forEach(selement => {
                if (element._id == selement.threadId) {
                    element["subThread"].push(selement)
                }
            });
        })
        getThreadData.forEach(element => {
            element["fullName"] = user_data.fullName;
            element["profileLogo"] = user_data.profileLogo;
        });
        res.render("threads/myThread", { layout: "main", threadData: getThreadData, auth: req.session.auth, userID: req.params.user_id, artist_data: artist_data, genre_data: genre_data })

    } catch (e) {
        res.status(401).redirect('/');
    }
});

router.get("/UserThread", async (req, res) => {
    try {
        let user_id = await jwt.verify(req.session.auth, 'secret').userid;
        let getThreadData = await data.threads.GetAllUserThreads(user_id);
        let user_data = await data.users.GetUserById(user_id);
        let thread_ids = getThreadData.map(x => x._id);
        let getsubThreadData = await data.threads.GetSubThread(thread_ids);
        let getLikeData = await data.threads.getThreadLikeWise(thread_ids, user_id);
        getThreadData.forEach(async (element) => {
            if (element.genres != ""){
                let genre_tag = await data.genres.GetGenresById(element.genres);
                element.genres = genre_tag.genreName;
            }
            if (element.artist != ""){
                let artist_tag = await data.artists.GetArtistsById(element.artist);
                
                element.artist = artist_tag.artistName;
            }
            getLikeData.forEach(lelement => {
                if (element._id == lelement.threadId && element.userId == user_id) {
                    element["userlike"] = 1
                }
            });
            element["subThread"] = [];
            getsubThreadData.forEach(selement => {
                if (element._id == selement.threadId) {
                    element["subThread"].push(selement)
                }
            });
        })
        getThreadData.forEach(element => {
            element["fullName"] = user_data.fullName;
            element["profileLogo"] = user_data.profileLogo;
        });
        let artist_data = await data.artists.GetAllArtists();
        let genre_data = await data.genres.GetAllGenres();
        res.render("threads/myThread", { layout: "main", threadData: getThreadData, auth: req.session.auth, userID: user_id, artist_data: artist_data, genre_data: genre_data });
    } catch (e) {
        res.status(401).redirect('/');
    }
});

router.post("/AddSubThread/:is_homepage", async (req, res) => {
    try {
        if (!req.body.thread_id) {
            res.status(401).json({ "message": "Please provide parent information" });
        } else if (!req.body.user_id) {
            res.status(401).json({ "message": "Please provide user information" });
        } else {
            let sub_thread_data = {
                _id: uuid.v4(),
                threadId: req.body.thread_id,
                userId: req.body.user_id,
                createdDate: moment(new Date()).format("DD/MM/YYYY HH:mm:ss"),
                lastUpdatedDate: moment(new Date()).format("DD/MM/YYYY HH:mm:ss"),
                comment: req.body.comment
            }
            let insertThread = await data.threads.CreateSubThread(sub_thread_data);
            if (req.params.is_homepage == 1) {
                let getThreadData = await data.threads.GetAllThreads();
                let thread_ids = getThreadData.map(x => x._id);
                let getLikeData = await data.threads.getThreadLikeWise(thread_ids, req.body.user_id);
                let getsubThreadData = await data.threads.GetSubThread(thread_ids);
                getThreadData.forEach(element => {
                    getLikeData.forEach(lelement => {
                        if (element._id == lelement.threadId && element.userId == req.body.user_id) {
                            element["userlike"] = 1
                        }
                    });
                    element["subThread"] = [];
                    getsubThreadData.forEach(selement => {
                        if (element._id == selement.threadId) {
                            element["subThread"].push(selement)
                        }
                    });
                });

                res.render("profile/homePage", {
                    layout: "main",
                    auth: req.session.auth,
                    threadData: getThreadData,
                    userID: req.body.user_id
                });

            } else {
                let getThreadData = await data.threads.GetAllUserThreads(req.body.user_id);
                let user_data = await data.users.GetUserById(req.body.user_id);
                let thread_ids = getThreadData.map(x => x._id);
                let getsubThreadData = await data.threads.GetSubThread(thread_ids);
                let getLikeData = await data.threads.getThreadLikeWise(thread_ids, req.body.user_id);
                let artist_data = await data.artists.GetAllArtists();
                let genre_data = await data.genres.GetAllGenres();
                getThreadData.forEach(element => {
                    getLikeData.forEach(lelement => {
                        if (element._id == lelement.threadId && element.userId == req.body.user_id) {
                            element["userlike"] = 1
                        }
                    });
                    element["subThread"] = [];
                    getsubThreadData.forEach(selement => {
                        if (element._id == selement.threadId) {
                            element["subThread"].push(selement)
                        }
                    });
                });
                getThreadData.forEach(element => {
                    element["fullName"] = user_data.fullName;
                    element["profileLogo"] = user_data.profileLogo;
                })
                res.render("threads/myThread", { layout: "main", threadData: getThreadData, auth: req.session.auth, userID: req.body.user_id, artist_data: artist_data, genre_data: genre_data });
            }
        }
    } catch (e) {
        res.status(401).redirect('/');
    }
});

router.get("/DeleteSubThread/:sub_thread_id/:user_id", async (req, res) => {
    try {
        let deleteThread = await data.threads.DeleteSubThread(req.params.sub_thread_id);
        let getThreadData = await data.threads.GetAllUserThreads(req.params.user_id);
        // let user_data = await data.users.GetUserById(req.params.user_id);
        let thread_ids = getThreadData.map(x => x._id);
        let getsubThreadData = await data.threads.GetSubThread(thread_ids);
        let getLikeData = await data.threads.getThreadLikeWise(thread_ids, req.params.user_id);
        let artist_data = await data.artists.GetAllArtists();
        let genre_data = await data.genres.GetAllGenres();
        getThreadData.forEach(element => {
            getLikeData.forEach(lelement => {
                if (element._id == lelement.threadId && element.userId == req.params.user_id) {
                    element["userlike"] = 1
                }
            });
            element["subThread"] = [];
            getsubThreadData.forEach(selement => {
                if (element._id == selement.threadId) {
                    element["subThread"].push(selement)
                }
            });
        });
        getThreadData.forEach(element => {
            element["fullName"] = user_data.fullName;
            element["profileLogo"] = user_data.profileLogo;
        })
        res.render("threads/myThread", { layout: "main", threadData: getThreadData, auth: req.session.auth, userID: req.params.user_id, artist_data: artist_data, genre_data: genre_data })

    } catch (e) {
        res.status(401).redirect('/');
    }
});

module.exports = router;
