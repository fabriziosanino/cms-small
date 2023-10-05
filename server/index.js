"use strict";

const express = require("express");
const morgan = require("morgan"); // logging middleware
const cors = require("cors");

const { check, validationResult } = require("express-validator"); // validation middleware

const userDao = require("./dao-user");
const dao = require("./dao");
const session = require("express-session");
const passport = require("passport");
const dayjs = require("dayjs");
const LocalStrategy = require("passport-local").Strategy;

passport.use(
	new LocalStrategy(function (username, password, done) {
		userDao.getUser(username, password).then((user) => {
			if (!user)
				return done(null, false, {
					message: "Incorrect username and/or password.",
				});

			return done(null, user);
		});
	})
);

passport.serializeUser((user, done) => {
	// Nella sessione viene solo salvato l'id dell'utente
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	userDao
		.getUserId(id)
		.then((user) => {
			// In questo modo, per le sessioni autenticate, abbiamo in req.user username, id, name, role
			done(null, user);
		})
		.catch((err) => {
			done(err, null);
		});
});

/*** init express and set-up the middlewares ***/
const app = new express();
app.use(morgan("dev"));
app.use(express.json());

app.use("/static", express.static("public"));

/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
const corsOptions = {
	origin: "http://localhost:5173",
	credentials: true,
};
app.use(cors(corsOptions));

/*** Utility Functions ***/
const isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated()) return next();

	return res.status(401).json({ error: "Not authenticated" });
};

app.use(
	session({
		secret: "efiuugbhj445trg9rer",
		resave: false,
		saveUninitialized: false,
	})
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/api/pages/published", (req, res) => {
	dao
		.listPublishedPages()
		.then((pages) => {
			let vecPromise = [];
			pages.map((p) => vecPromise.push(dao.listBlocksByPage(p.id)));
			Promise.all(vecPromise)
				.then((resultBlocks) => {
					pages.map((p, pos) => {
						//I blocchi vengono resitituiti in ordine per come sono passati nel vettore alla Promise
						p.blocks = resultBlocks[pos];
					});
					res.json(pages);
				})
				.catch((err) => {
					console.log(err);
					res.status(503).json({ error: "Database error getting published pages." });
				});
		})
		.catch((err) => {
			console.log(err);
			res.status(500).end();
		});
});

app.get("/api/pages", isLoggedIn, (req, res) => {
	dao
		.listPages()
		.then((pages) => {
			let vecPromise = [];
			pages.map((p) => vecPromise.push(dao.listBlocksByPage(p.id)));
			Promise.all(vecPromise)
				.then((resultBlocks) => {
					pages.map((p, pos) => {
						p.blocks = resultBlocks[pos];
					});
					res.json(pages);
				})
				.catch((err) => {
					console.log(err);
					res.status(503).json({ error: "Database error getting pages." });
				});
		})
		.catch((err) => {
			console.log(err);
			res.status(500).end();
		});
});

app.get("/api/website/name", (req, res) => {
	dao
		.getWebsiteName()
		.then((result) => {
			res.json(result);
		})
		.catch((err) => {
			console.log(err);
			res.status(500).end();
		});
});

app.put("/api/website/name", isLoggedIn, [check("webSiteName").notEmpty()], (req, res) => {
	if (req.user.role === "admin") {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ error: "WebsiteName invalid." });
		} else {
			dao
				.setWebSiteName(req.body.webSiteName)
				.then(() => {
					res.json({});
				})
				.catch((err) => {
					console.log(err);
					res.status(500).end();
				});
		}
	} else {
		res.status(401).end();
	}
});

const deleteBlocks = (pagesDeleted, req, res) => {
	if (pagesDeleted === 1) {
		dao
			.deleteBlocksByPageId(req.params.id)
			.then((blocksDeleted) => {
				res.json(blocksDeleted + pagesDeleted);
			})
			.catch((err) => {
				console.log(err);
				res.status(503).json({ error: "Database error during the deletion of blocks." });
			});
	} else {
		//Non è stata eliminata nessuna pagina, quindi o non esiste oppure l'utente non è l'autore della pagina
		res.status(503).json({ error: "Database error during the deletion of page." });
	}
};

app.delete("/api/pages/:id", isLoggedIn, (req, res) => {
	if (req.user.role === "admin") {
		dao
			.deletePageAdmin(req.params.id)
			.then((pagesDeleted) => deleteBlocks(pagesDeleted, req, res))
			.catch((err) => {
				console.log(err);
				res.status(503).json({ error: "Database error during the deletion of page." });
			});
	} else {
		dao
			.deletePage(req.params.id, req.user.id)
			.then((pagesDeleted) => deleteBlocks(pagesDeleted, req, res))
			.catch((err) => {
				console.log(err);
				res.status(503).json({ error: "Database error during the deletion of page." });
			});
	}
});

app.get("/api/images", isLoggedIn, (req, res) => {
	dao
		.getImages()
		.then((result) => {
			res.json(result);
		})
		.catch((err) => {
			console.log(err);
			res.status(500).json({ error: "Database error getting images" });
		});
});

app.get("/api/users", isLoggedIn, (req, res) => {
	if (req.user.role === "admin") {
		userDao
			.getUsers()
			.then((result) => {
				res.json(result);
			})
			.catch((err) => {
				console.log(err);
				res.status(500).json({ error: "Database error getting users" });
			});
	} else {
		res.status(401).end();
	}
});

const checkPageBlocks = (blocks) => {
	let header = false;
	let other = false;
	let positionSum = 0;
	/* Controllo che ci siano tutte le position da 0 a length */
	let positionSumValid = (blocks.length * (blocks.length - 1)) / 2;

	blocks.forEach((b) => {
		if (b.type === "header" && b.header !== "") header = true;
		else if (
			(b.type === "image" && b.image !== "") ||
			(b.type === "paragraph" && b.paragraph !== "")
		)
			other = true;

		positionSum += b.position;
	});

	if (positionSum === positionSumValid) return header && other;
	else return false;
};

const checkBlockContent = async (blocks) => {
	const images = await dao.getImages();
	let error = false;
	blocks.forEach((b) => { 
		if (b[b.type] === "") {
			error = true;
		} else if (b.type === "image" && !images.some(i => i.id === parseInt(b.image))) {
			error = true;
		}
	});

	return error;
}
 
app.post("/api/pages", isLoggedIn, [check("blocks").isArray({min: 2}), check("title").notEmpty()], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: "Page must almost have two blocks and/or Title must be valid." });
	}

	if(!checkPageBlocks(req.body.blocks)) {
		return res.status(422).json({ error: "Blocks not valid." });
	}

	if(await checkBlockContent(req.body.blocks)) {
		return res.status(422).json({ error: "Blocks content not valid." });
	}

	if (req.body.publication != "" && !dayjs(req.body.publication).isValid()) {
		return res.status(422).json({ error: "Publication date not valid." });
	}

	const page = {
		title: req.body.title,
		creation: dayjs().format("YYYY-MM-DD"),
		publication: req.body.publication != "" && req.body.publication != undefined ? dayjs(req.body.publication).format("YYYY-MM-DD") : "",
	};

	if (req.user.role === "admin") { 
		// Se non è presente il campo author, l'autore sarà l'utente stesso
		let author;
		if (!req.body.hasOwnProperty("author"))
			author = req.user.id;
		else if(isNaN(parseInt(req.body.author)))
			return res.status(422).json({ error: "Author not valid."});
		else	
			author = req.body.author;

		const result = await userDao.getUserId(parseInt(author));
		if (result.error) 
			return res.status(422).json({ error: "Author not found" })
		else 
			page.author = parseInt(author);
	} else 
		/* Che sia presente o no il campo author è indifferente, l'autore non può essere modificato */
		page.author = req.user.id;

	dao
		.createPage(page)
		.then((pageId) => {
			let vecPromise = [];
			req.body.blocks.map((b) => {
				const block = {
					type: b.type,
					header: b.type === "header" ? b.header : "",
					paragraph: b.type === "paragraph" ? b.paragraph : "",
					image: b.type === "image" ? parseInt(b.image) : parseInt(""),
					page: pageId,
					position: parseInt(b.position),
				};
				vecPromise.push(dao.createBlock(block));
			});
			Promise.all(vecPromise)
				.then((resultBlockIds) => {
					res.status(201).json(pageId);
				})
				.catch((err) => {
					console.log(err);
					res.status(503).json({ error: "Database error inserting blocks" });
				});
		})
		.catch((err) => {
			console.log(err);
			res.status(503).json({ error: "Database error during the creation of the page" });
		});
});


const updateBlocks = (req, res) => {
	dao
		.deleteBlocksByPageId(req.params.id)
		.then((result) => {
			let vecPromise = [];
			req.body.blocks.map((b) => {
				const block = {
					type: b.type,
					header: b.type === "header" ? b.header : "",
					paragraph: b.type === "paragraph" ? b.paragraph : "",
					image: b.type === "image" ? parseInt(b.image) : parseInt(""),
					page: req.params.id,
					position: parseInt(b.position),
				};
				vecPromise.push(dao.createBlock(block));
			});
			Promise.all(vecPromise)
				.then((resultBlockIds) => {
					return res.status(200).json(req.params.id);
				})
				.catch((err) => {
					console.log(err);
					return res.status(503).json({ error: "Database error updating blocks" });
				});
		})
		.catch((err) => {
			return res.status(503).json({ erro: "Database error during the update of the page" });
		});
};

app.put("/api/pages/:id", isLoggedIn, [check("blocks").isArray({min: 2}), check("title").notEmpty()], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: "Page must almost have two blocks and/or Title must be valid." });
	}

	if(!checkPageBlocks(req.body.blocks)) {
		return res.status(422).json({ error: "Blocks not valid." });
	}

	if(await checkBlockContent(req.body.blocks)) {
		return res.status(422).json({ error: "Blocks content not valid." });
	}

	if (req.body.publication != "" && !dayjs(req.body.publication).isValid()) {
		return res.status(422).json({ error: "Publication date not valid." });
	}

	if (req.user.role === "admin") {
		let author;
		if (!req.body.hasOwnProperty("author"))
			return res.status(422).json({ error: "Author not provided"});
		else if(isNaN(parseInt(req.body.author)))
			return res.status(422).json({ error: "Author not valid."});
		else	
			author = req.body.author;

		userDao
			.getUserId(parseInt(author))
			.then((result) => {
				if (result.error) {
					res.status(422).json({ error: "Author not found" });
				} else {
					const page = {
						id: parseInt(req.params.id),
						title: req.body.title,
						publication: req.body.publication != "" && req.body.publication != undefined ? dayjs(req.body.publication).format("YYYY-MM-DD") : "",
						author: parseInt(author),
					};

					dao
						.updatePageAdmin(page)
						.then((modifiedPages) => {
							if(modifiedPages === 0) 
								return res.status(422).json({ error: "Page not valid"});
							else
								updateBlocks(req, res)
						})
						.catch((err) => {
							console.log(err);
							res.status(503).json({ error: "Database error during the update of the page" });
						});	
				}
			})
			.catch((err) => {
				console.log(err);
				res.status(422).json({error: "Unexpected error during update"});
			});
	} else {
		/* Che sia presente o no il campo author è indifferente, l'autore non può essere modificato */
		const page = {
			id: parseInt(req.params.id),
			title: req.body.title,
			publication: req.body.publication != "" && req.body.publication != undefined ? dayjs(req.body.publication).format("YYYY-MM-DD") : "",
		};

		dao
			.updatePage(page)
			.then((modifiedPages) => {
				if(modifiedPages === 0) 
					return res.status(422).json({ error: "Page not valid"});
				else
					updateBlocks(req, res)
			})
			.catch((err) => {
				console.log(err);
				res.status(503).json({ error: "Database error during the update of the page" });
			});
		}
	}
);

app.post("/api/sessions", function (req, res, next) {
	passport.authenticate("local", (err, user, info) => {
		if (err) return next(err);
		if (!user) return res.status(401).json(info);

		req.login(user, (err) => {
			if (err) return next(err);
			return res.json(req.user);
		});
	})(req, res, next);
});

app.delete("/api/sessions/current", (req, res) => {
	req.logout(() => {
		res.json({});
	});
});

app.get("/api/sessions/current", (req, res) => {
	if (req.isAuthenticated()) res.status(201).json(req.user);
	else res.status(401).json({ error: "Unauthenticated user!" });
});

// activate the server
const port = 3001;
app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});
