import dayjs from "dayjs";

const SERVER_URL = "http://localhost:3001/api/";

/**
 * Utility function per il parsing del json.
 */
function getJson(httpResponsePromise) {
	// Il server API ritorna sempre il JSON, in caso di errore il formato è {error: "Message"}
	return new Promise((resolve, reject) => {
		httpResponsePromise
			.then((response) => {
				if (response.ok) {
					// Il server restituisice sempre un JSON, anche vuoto {}. Mai null o un valore non json, altrimenti il metodo fallirà
					response
						.json()
						.then((json) => resolve(json))
						.catch((err) => reject({ error: "Cannot parse server response" }));
				} else {
					// Analisi causa dell'errore
					response
						.json()
						.then((obj) => reject(obj)) // errore nel body della risposta
						.catch((err) => reject({ error: "Cannot parse server response" }));
				}
			})
			.catch((err) => reject({ error: "Cannot communicate" })); // errore di connessione
	});
}

function getAllPublishedPages() {
	return getJson(
		fetch(SERVER_URL + "pages/published", {
			credentials: "include",
		})
	).then((json) => {
		return json.map((page) => {
			const clientPage = {
				id: parseInt(page.id),
				title: page.title,
				creation: dayjs(page.creation),
				publication: dayjs(page.publication),
				authorId: parseInt(page.authorId),
				authorName: page.authorName,
				blocks: page.blocks,
			};
			return clientPage;
		});
	});
}

/*function getAllBlocksByPage(pageId) {
	return getJson(
		fetch(SERVER_URL + "blocks/" + pageId, { credentials: "include" })
	).then(json => {
		return json.map((block) => {
			const clientBlock = {
				id: block.id,
				type: parseInt(block.type),
				header: block.header,
				paragraph: block.paragraph,
				image: block.image,
				pageId: parseInt(block.page),
				position: parseInt(block.position)
			};
			return clientBlock;
		});	
	});
}*/

function getAllPages() {
	return getJson(
		fetch(SERVER_URL + "pages", {
			credentials: "include",
		})
	).then((json) => {
		return json.map((page) => {
			const clientPage = {
				id: parseInt(page.id),
				title: page.title,
				creation: dayjs(page.creation),
				publication: dayjs(page.publication),
				authorId: parseInt(page.authorId),
				authorName: page.authorName,
				blocks: page.blocks,
			};
			return clientPage;
		});
	});
}

function getImages() {
	return getJson(
		fetch(SERVER_URL + "images", {
			credentials: "include",
		})
	).then((json) => {
		return json.map((image) => {
			const clientImg = {
				id: parseInt(image.id),
				url: image.url,
			};
			return clientImg;
		});
	});
}

function insertNewPage(page) {
	return getJson(
		fetch(SERVER_URL + "pages", {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(
				Object.assign({}, page, {
					publication: page.publication !== "" ? page.publication.format("YYYY-MM-DD"): "",
				})
			),
		})
	);
}

function updatePage(page) {
	return getJson(
		fetch(SERVER_URL + "pages/" + page.id, {
			method: "PUT",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(
				Object.assign({}, page, {
					publication: page.publication !== "" ? page.publication.format("YYYY-MM-DD"): "",
				})
			),
		})
	);
}

function deletePage(id) {
	return getJson(
		fetch(SERVER_URL + "pages/" + id, {
			credentials: "include",
			method: "DELETE",
		})
	);
}

function getWebsiteName() {
	return getJson(
		fetch(SERVER_URL + "website/name", { credentials: "include" })
	).then((json) => {
		return {
			name: json.name,
		};
	});
}

function setWebsiteName(name) {
	return getJson(
		fetch(SERVER_URL + "website/name", {
			method: "PUT",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				webSiteName: name,
			}),
		})
	);
}

function getUsers() {
	return getJson(fetch(SERVER_URL + "users", { credentials: "include" })).then(
		(json) => {
			return json.map((user) => {
				const clientUser = {
					id: parseInt(user.id),
					username: user.email,
					name: user.name,
					role: user.role,
				};
				return clientUser;
			});
		}
	);
}

function logOut() {
	return getJson(
		fetch(SERVER_URL + "sessions/current", {
			method: "DELETE",
			credentials: "include",
		})
	);
}

function logIn(credentials) {
	return getJson(
		fetch(SERVER_URL + "sessions", {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(credentials),
		})
	);
}

function getUserInfo() {
	return getJson(
		fetch(SERVER_URL + "sessions/current", {
			credentials: "include",
		})
	);
}

const API = {
	logIn,
	logOut,
	getUserInfo,
	getAllPublishedPages,
	/*getAllBlocksByPage*/ getWebsiteName,
	getAllPages,
	deletePage,
	getImages,
	insertNewPage,
	updatePage,
	getUsers,
	setWebsiteName
};
export default API;
