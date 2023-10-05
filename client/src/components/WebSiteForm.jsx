import { Form, Card, Alert, Button } from "react-bootstrap";
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import MessageContext from "../messageCtx";

import API from "../API";

function WebSiteForm(props) {
	const [webSiteName, setWebSiteName] = useState(props.webSiteName);
	const [errorMsg, setErrorMsg] = useState("");

	const navigate = useNavigate();

	const { handleErrors } = useContext(MessageContext);

	const handleSubmit = (event) => {
		event.preventDefault();

		if (webSiteName != "") {
			API.setWebsiteName(webSiteName)
				.then(() => navigate("/back-office"))
				.catch((err) => {
					handleErrors(err);
				});
		} else {
			setErrorMsg("WebSite Name must be valid.");
		}
	};

	return (
		<Card className="m-5">
			<Card.Body>
				<Form onSubmit={handleSubmit}>
					<Form.Group className="mb-3">
						<Form.Label>WebSite Name</Form.Label>
						<Form.Control
							type="text"
							name="webSiteName"
							value={webSiteName}
							onChange={(ev) => setWebSiteName(ev.target.value)}
						/>
					</Form.Group>
					<Button type="submit" variant="primary">
						Save
					</Button>
					<Button className="mx-2" variant="danger" onClick={() => navigate("/back-office") }> Cancel </Button>
				</Form>
				{errorMsg ? (
					<Alert
						className="m-3"
						variant="danger"
						onClose={() => setErrorMsg("")}
						dismissible
					>
						{errorMsg}
					</Alert>
				) :  false }
			</Card.Body>
		</Card>
	);
}

export { WebSiteForm };
