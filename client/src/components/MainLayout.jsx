import "bootstrap-icons/font/bootstrap-icons.css";

import { Container, Row, Spinner } from "react-bootstrap";
import { useEffect, useContext } from "react";
import { useLocation, Link } from "react-router-dom";

import { PageCard } from "./PageCard";

import MessageContext from "../messageCtx";

import API from "../API";

function Loading(props) {
	return <Spinner className="m-2" animation="border" role="status" />;
}

function MainLayout(props) {
	const location = useLocation();

	const { handleErrors } = useContext(MessageContext);

	const pages = props.pages;
	const itemPerRow = 3;

	let cmsLocation = "";
	if (location.pathname === "/" || location.pathname === "/back-office")
		cmsLocation = location.pathname;

	/* Serve per far si che ogni volta che si cambia route, si presupponga che il contenuto non sia aggiornato. Poi in base alla route si andrà
		a decidere cosa reperire dal server.
	*/
	useEffect(() => {
		props.setDirty(true);
	}, [cmsLocation])

	useEffect(() => {
		if (props.dirty) {
			API.getWebsiteName()
				.then((result) => {
					props.setWebsiteName(result.name);
				})
				.catch((err) => handleErrors(err));
			if(props.handled === undefined || (props.handled !== undefined && props.handled)) {
				if (cmsLocation === "/back-office") {
					//BACK-OFFICE
					API.getAllPages()
						.then((pages) => {
							props.setDirty(false);
							props.setPages(pages);
							props.setInitialLoading(false);
							props.setHandled(undefined);
						})
						.catch((err) => handleErrors(err));
				} else if (cmsLocation === "/") {
					//FRONT-OFFICE
					API.getAllPublishedPages()
						.then((pages) => {
							props.setDirty(false);
							props.setPages(pages);
							props.setInitialLoading(false);
							props.setHandled(undefined);
						})
						.catch((err) => handleErrors(err));
				}
			}
		}
	}, [props.dirty, cmsLocation, props.handled]);
	//L'implementazione è come quella del lab perche qui è proprio come se fosse un filtro, dove però, uno è protetto dal login. 
	//Facendo in questo modo si evita di duplicare questo componente due volte. Sono pressochè identici, cambiano i dati che mostra ed un bottone

	const deletePage = (id) => {
		props.setPages((oldPages) =>
			oldPages.map((p) =>
				p.id !== id ? p : Object.assign({}, p, { status: "deleted" })
			)
		);
		API.deletePage(id)
			.then(() => props.setDirty(true))
			.catch((err) => handleErrors(err));
	};

	return (
		<Container>
			{props.initialLoading ? ( <Loading />) : (
				/* Si crea un gruppo di 3 pagine da mettere nella <Row>, ogni pagina avrà la propria <Col>  */
				pages.map((_, position) => {
					if (position % itemPerRow === 0) {
						// Slice prende da position (start), n elementi (end) 
						const row = pages.slice(position, position + itemPerRow);
						return (
							<Row key={position} className="m-2">
								{row.map((p, pos) => (
									<PageCard
										userId={props.user && props.user.id}
										role={props.user && props.user.role}
										key={pos}
										page={p}
										deletePage={deletePage}
										cmsLocation={cmsLocation}
									/>
								))}
							</Row>
						);
					}
				})
			)}
			{cmsLocation === "/back-office" ? (
				<Link
					className="btn btn-primary btn-lg fixed-right-bottom"
					to="/add"
					state={{ nextpage: location.pathname }}
				>
					{" "}
					&#43;{" "}
				</Link>
			) : false }
		</Container>
	);
}

export { MainLayout };
