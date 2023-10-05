import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

import { Link, BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Container, Row, Col, Toast } from "react-bootstrap";
import { Navigation } from "./components/Navigation";
import { LoginForm } from "./components/AuthComponents";
import { MainLayout } from "./components/MainLayout";
import { PageForm } from "./components/PageForm";
import { WebSiteForm } from "./components/WebSiteForm";
import { useState, useEffect } from "react";

import MessageContext from "./messageCtx";

import API from "./API";

function DefaultRoute() {
	return (
		<Container className="App">
			<h1>No data here...</h1>
			<h2>This is not the route you are looking for!</h2>
			<Link to="/">Please go back to main page</Link>
		</Container>
	);
}

function App() {
	const [message, setMessage] = useState("");

	const [loggedIn, setLoggedIn] = useState(false);
	const [user, setUser] = useState(undefined);

	const [dirty, setDirty] = useState(true);
	const [pages, setPages] = useState([]);
	const [initialLoading, setInitialLoading] = useState(true);

	const [websiteName, setWebsiteName] = useState("");

	/*const [images, setImages] = useState([]);*/

	/*
	  Per aspettare di richiedere al client le pagine, finchè l'inserimento o la modifica non si sono concluse. Così l'utente capisce che la 
	  modifica non è ancora avvenuta. Dirty non basta perchè appena si torna nel back-office, si scatena una richiesta al server che in questi due
	  casi non sono ottimali. (Si chiede comunque al server il nome del sito web)
	*/
	const [handled, setHandled] = useState(undefined);  

	const handleErrors = (err) => {
		let msg = "";
		if (err.error) msg = err.error;
		else if (String(err) === "string") msg = String(err);
		else msg = "Unknown Error";
		setMessage(msg);
		setTimeout(() => {setDirty(true); setHandled(undefined)}, 3000);
	};

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const user = await API.getUserInfo();
				setLoggedIn(true);
				setUser(user);
				setDirty(true);
			} catch (err) {}
		};

		checkAuth();
	}, []);

	const doLogOut = async () => {
		await API.logOut();
		setLoggedIn(false);
		setUser(undefined);
		setDirty(true);
	};

	const loginSuccessful = (user) => {
		setUser(user);
		setLoggedIn(true);
		// Non serve il setDirty(true) perchè in automatico, quando cambia la route, viene messo dirty a true
	};

	const addPage = (newPage) => {
		setPages((oldList) => {			
			/* L'id creato è temporaneo, si aspetta che arrivi quello vero dal db che lo andrà a sostituire. */
			// ... perchè il max non prende come parametro un array
			const newTempId = Math.max(...oldList.map((p) => p.id)) + 1;
			newPage.id = newTempId;
			newPage.status = "added";
			return [...oldList, newPage];
		});
		API.insertNewPage(newPage)
			.then(() => {
				setHandled(true);
				setDirty(true);
			})
			.catch((err) => handleErrors(err));
	};

	const updatePage = (page) => {
		setPages((oldList) =>
			oldList.map((p) => {
				if (p.id === page.id) {
					page.status = "updated";
					return page;
				} else {
					return p;
				}
			})
		);
		API.updatePage(page)
			.then(() => {
				setHandled(true);
				setDirty(true);
			})
			.catch((err) => handleErrors(err));
	};

	return (
		<BrowserRouter>
			<MessageContext.Provider value={{ handleErrors }}>
				<Container fluid className="App">
					<Navigation name={websiteName} user={user} logout={doLogOut} />
					<Row className="vh-100">
						<Col className="below-nav">
							<Routes>
								<Route
									path="/"
									element={
										<MainLayout
											user={user}
											pages={pages}
											dirty={dirty}
											setDirty={setDirty}
											setWebsiteName={setWebsiteName}
											setPages={setPages}
											initialLoading={initialLoading}
											setInitialLoading={setInitialLoading}
											handled={handled}
											setHandled={setHandled}
										/>
									}
								/>
								<Route
									path="/back-office"
									element={
										<MainLayout
											user={user}
											pages={pages}
											dirty={dirty}
											setDirty={setDirty}
											setWebsiteName={setWebsiteName}
											setInitialLoading={setInitialLoading}
											initialLoading={initialLoading}
											setPages={setPages}
											handled={handled}
											setHandled={setHandled}
										/>
									}
								/>
								<Route
									path="/add"
									element={
										<PageForm
											user={user}
											addPage={addPage}
											setDirty={setDirty}
											setHandled={setHandled}
										/>
									}
								/>
								<Route
									path="/edit/:pageId"
									element={
										<PageForm
											user={user}
											pages={pages}
											updatePage={updatePage}
											setDirty={setDirty}
											setHandled={setHandled}
										/>
									}
								/>
								<Route
									path="/editWebsiteName"
									element={
										<WebSiteForm
											setDirty={setDirty}
											webSiteName={websiteName}
										/>
									}
								/>
								<Route
									path="/login"
									element={
										loggedIn ? (
											<Navigate replace to="/" />
										) : (
											<LoginForm
												setDirty={setDirty}
												loginSuccessful={loginSuccessful}
											/>
										)
									}
								/>
								<Route path="/*" element={<DefaultRoute />} />
							</Routes>
							<Toast
								show={message !== ""}
								onClose={() => setMessage("")}
								delay={5000}
								autohide
								className="fixed-right-left"
							>
								<Toast.Body>{message}</Toast.Body>
							</Toast>
						</Col>
					</Row>
				</Container>
			</MessageContext.Provider>
		</BrowserRouter>
	);
}

export default App;
