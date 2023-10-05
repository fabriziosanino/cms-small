"use strict";

const db = require("./db");
const dayjs = require("dayjs");

exports.listPublishedPages = () => {
	return new Promise((resolve, reject) => {
		const sql =
			"SELECT pages.id AS pageId, title, creation, publication, users.id AS authorId, name " +
			"FROM pages JOIN users ON pages.author = users.id " +
			"WHERE publication IS NOT NULL AND DATE(publication) < DATE('now') ORDER BY publication";

		db.all(sql, [], (err, rows) => {
			if (err) {
				reject(err);
				return;
			}
			const pages = rows.map((p) => ({
				id: p.pageId,
				title: p.title,
				creation: dayjs(p.creation),
				publication: dayjs(p.publication),
				authorId: parseInt(p.authorId),
				authorName: p.name,
			}));
			resolve(pages);
		});
	});
};

exports.listBlocksByPage = (pageId) => {
	return new Promise((resolve, reject) => {
		const sql =
			"SELECT blocks.id AS blockId, type, header, paragraph, images.id AS imageId, images.url AS imageUrl, position FROM blocks LEFT join images ON image = images.id WHERE page = ? ORDER BY position";
		db.all(sql, [pageId], (err, rows) => {
			if (err) {
				reject(err);
				return;
			}
			if (rows == undefined) {
				resolve({ error: "Page not found." });
			} else {
				const blocks = rows.map((b) => ({
					id: parseInt(b.blockId),
					type: b.type,
					header: b.header,
					paragraph: b.paragraph,
					imageUrl: b.imageUrl,
					image: parseInt(b.imageId),
					position: parseInt(b.position),
				}));

				resolve(blocks);
			}
		});
	});
};

exports.listPages = () => {
	return new Promise((resolve, reject) => {
		const sql =
			"SELECT pages.id AS pageId, title, creation, publication, users.id AS authorId, name " +
			"FROM pages JOIN users ON pages.author = users.id " +
			"ORDER BY publication";

		db.all(sql, [], (err, rows) => {
			if (err) {
				reject(err);
				return;
			}
			const pages = rows.map((p) => ({
				id: parseInt(p.pageId),
				title: p.title,
				creation: dayjs(p.creation),
				publication: dayjs(p.publication),
				authorId: parseInt(p.authorId),
				authorName: p.name,
			}));
			resolve(pages);
		});
	});
};

exports.getPage = (id, userId) => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM pages WHERE id = ? AND author = ?";

		db.get(sql, [id, userId], (err, row) => {
			if (err) {
				reject(err);
				return;
			}
			if (row == undefined) {
				resolve({ error: "Page not found" });
			} else {
				const page = {
					id: parseInt(id),
					title: title,
					creation: dayjs(creation),
					publication: dayjs(publication),
					authorId: parseInt(author),
				};
				resolve(page);
			}
		});
	});
};

exports.createPage = (page) => {
	return new Promise((resolve, reject) => {
		const sql = "INSERT INTO pages(title, creation, publication, author) VALUES(?, DATE(?), DATE(?), ?)";
		db.run(sql, [page.title, page.creation, page.publication, page.author], function(err) {
			if(err) {
				reject(err);
				return;
			}
			resolve(this.lastID);
		});
	});
}


exports.updatePage = (page) => {
	return new Promise((resolve, reject) => {
		const sql =
			"UPDATE pages SET title=?, publication=DATE(?) WHERE id = ?";
		db.run(
			sql,
			[page.title, page.publication, page.id],
			function (err) {
				if (err) {
					reject(err);
					return;
				}
				resolve(this.changes);
			}
		);
	});
};

exports.updatePageAdmin = (page) => {
	return new Promise((resolve, reject) => {
		const sql = "UPDATE pages SET title=?, publication=DATE(?), author=? WHERE id = ?";
		db.run(sql, [page.title, page.publication, page.author, page.id], function (err) {
			if (err) {
				reject(err);
				return;
			}
			resolve(this.changes);
		});
	});
}

exports.createBlock = (block) => {
	return new Promise((resolve, reject) => {
		const sql =
			"INSERT INTO blocks(type, header, paragraph, image, page, position) VALUES(?, ?, ?, ?, ?, ?)";
		db.run(
			sql,
			[block.type, block.header, block.paragraph, block.image, block.page, block.position],
			function (err) {
				if (err) {
					reject(err);
					return;
				}
				resolve(this.lastId);
			}
		);
	});
}

exports.deletePage = (id, userId) => {
	return new Promise((resolve, reject) => {
		const sql = "DELETE FROM pages WHERE id = ? AND author = ?";
		db.run(sql, [id, userId], function (err) {
			if (err) {
				reject(err);
				return;
			} else {
				resolve(this.changes); //Number of deleted page
			}
		});
	});
};

exports.deletePageAdmin = (id) => {
	return new Promise((resolve, reject) => {
		const sql = "DELETE FROM pages WHERE id = ?";
		db.run(sql, [id], function (err) {
			if (err) {
				reject(err);
				return;
			} else {
				resolve(this.changes); //Number of deleted page
			}
		});
	});
};

exports.deleteBlocksByPageId = (id) => {
	return new Promise((resolve, reject) => {
		const sql = "DELETE FROM blocks WHERE page = ?";
		db.run(sql, [id], function (err) {
			if (err) {
				reject(err);
				return;
			} else {
				resolve(this.changes); //Number of deleted blocks
			}
		});
	});
};

exports.getWebsiteName = () => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM website";
		db.get(sql, [], (err, row) => {
			if (err) {
				reject(err);
				return;
			}
			const name = {
				name: row.name,
			};

			resolve(name);
		});
	});
};

exports.setWebSiteName = (name) => {
	return new Promise((resolve, reject) => {
		const sql = "UPDATE website SET name=?";
		db.run(sql, [name], (err, row) => {
			if (err) {
				reject(err);
				return;
			}

			resolve();
		});
	});
}

exports.getImages = () => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM images";
		db.all(sql, [], (err, rows) => {
			if (err) {
				reject(err);
				return;
			}
			const images = rows.map((r) => ({
				id: parseInt(r.id),
				url: r.url,
			}));
			resolve(images);
		});
	});
};
