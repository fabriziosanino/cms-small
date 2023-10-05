import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";

import { Navbar, Nav, Button } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";

const Navigation = (props) => {
	const navigate = useNavigate();

	const name = props.user && props.user.name;
	const role = props.user && props.user.role;

	const location = useLocation();

	/* 
	Per capire in che posizione del CMS si è, si utilizza la location. Si poteva utilizzare uno stato (prima versione sviluppata)
	ma suddividendo in routes diverese è più chiaro per l'utente il cambio di posizione (da front-office a back-office e viceversa)
	 */
	let cmsLocation = "";
	if (location.pathname === "/" || location.pathname === "/back-office") 
		cmsLocation = location.pathname;

	return (
		<Navbar
			bg="primary"
			expand="sm"
			variant="dark"
			fixed="top"
			className="navbar-padding"
		>
			<Navbar.Brand>{props.name}</Navbar.Brand>
			{cmsLocation !== "" && cmsLocation === "/back-office" && role === "admin" ? (
				<Button
					variant="secondary"
					className="m-2"
					onClick={() => { navigate("/editWebSiteName");}}
				>
					<i className="bi bi-pencil-square" />
				</Button>
			) : false }
			<Nav className="my-2 my-lg-0 mx-auto d-sm-block" />
			<Nav className="ml-md-auto">
				<Nav.Item>
					{name ? (
						<>
							<Navbar.Text className="fs-5">
								{"Welcome, " + name}
								{props.user.role === "admin" ? " (Administrator)" : ""}
							</Navbar.Text>
							{cmsLocation !== "" ? (
								cmsLocation === "/" ? (
									<Button
										className="mx-2"
										variant="dark"
										onClick={() => navigate("/back-office") }
									>
										Go to Back-Office
									</Button>
								) : (
									<Button
										className="mx-2"
										variant="light"
										onClick={() => navigate("/")}
									>
										Go to Front-Office
									</Button>
								)
							) : false }
							<Button
								className="mx-2"
								variant="danger"
								onClick={() => {
									props.logout();
									navigate("/");
								}}
							>
								Logout
							</Button>
						</>
					) : (
						<Button
							className="mx-2"
							variant="warning"
							onClick={() => navigate("/login")}
						>
							Login
						</Button>
					)}
				</Nav.Item>
			</Nav>
		</Navbar>
	);
};

export { Navigation };
