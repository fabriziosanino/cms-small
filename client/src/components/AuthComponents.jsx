import { Form, Button, Alert, Container, Row, Col } from "react-bootstrap";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../API";

function LoginForm(props) {
	const [username, setUsername] = useState("u1@c.it");
	const [password, setPassword] = useState("pwd");
	const [errorMessage, setErrorMessage] = useState("");

	const navigate = useNavigate();

	const doLogIn = (credentials) => {
		API.logIn(credentials)
			.then((user) => {
				setErrorMessage("");
				props.loginSuccessful(user);
			})
			.catch((err) => {
				setErrorMessage("Wrong username or password");
			});
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		setErrorMessage("");

		const credentials = { username, password };

		let valid = true;
		if (username == "" && password == "") {
			valid = false;
			setErrorMessage("Please fill the Email and Password field");
		} else if(username == "") {
			valid = false;
			setErrorMessage("Please fill the Email field with valid email");
		} else if(password == "") {
			valid = false;
			setErrorMessage("Please fill the Password field");
		}

		if (valid) doLogIn(credentials);
	};

	return (
		<Container>
			<Row>
				<Col xs={4} />
				<Col xs={4}>
					<h2>Login</h2>
					<Form onSubmit={handleSubmit}>
						<Form.Group controlId="username">
							<Form.Label>Email</Form.Label>
							<Form.Control
								type="email"
								value={username}
								onChange={(ev) => setUsername(ev.target.value)}
							></Form.Control>
						</Form.Group>
						<Form.Group controlId="password">
							<Form.Label>Password</Form.Label>
							<Form.Control
								type="password"
								value={password}
								onChange={(ev) => setPassword(ev.target.value)}
							></Form.Control>
						</Form.Group>
						<Button className="my-2" type="submit">
							Login
						</Button>
						<Button
							className="my-2 mx-2"
							variant="danger"
							onClick={() => {
								navigate("/");}}
						>
							Cancel
						</Button>
						{errorMessage ? (
							<Alert
								variant="danger"
								dismissible
								onClick={() => setErrorMessage("")}
							>
								{errorMessage}
							</Alert>
						) : (
							""
						)}
					</Form>
				</Col>
				<Col xs={4}></Col>
			</Row>
		</Container>
	);
}

export { LoginForm };
