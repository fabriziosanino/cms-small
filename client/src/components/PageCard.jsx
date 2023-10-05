import "bootstrap-icons/font/bootstrap-icons.css";

import { Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import dayjs from "dayjs";

function CardContent(props) {
	const page = props.page;

	return (
		<>
			<Card.Title className="text-uppercase fs-5">
				<strong>{page.title}</strong>
			</Card.Title>
			{page.blocks.map((b, position) => (
                <span key={position}>
				{
					b.type === "header" ? (
						<Card.Subtitle className="m-1" key={b.id}>
							<u>{b.header}</u>
						</Card.Subtitle>
					) : false
				}
				{
					b.type === "paragraph" ? (
						<Card.Text key={b.id} className="m-1">
							<i>{b.paragraph}</i>
						</Card.Text>
					) : false
				}
				{
					b.type === "image" ? (
						<Card.Img
							className="m-1"
							key={b.id}
							src={b.imageUrl}
						></Card.Img>
					) : false
				}
                </span>
			))}
		</>
	);
}

function PageCard(props) {
	const formatWatchDate = (dayJsDate, format) => {
		return dayJsDate ? dayJsDate.format(format) : "";
	};

	const page = props.page;

	const navigate = useNavigate();

	let statusClass = "border-primary border-2 m-1";

	switch (page.status) {
		case "added":
			statusClass = "border-success border-2 m-1";
			break;
		case "deleted":
			statusClass = "border-danger border-2 m-1";
			break;
		case "updated":
			statusClass = "border-warning border-2 m-1";
			break;
		default:
			break;
	}

	return (
		<Col key={page.id} /*sm={12} md={6} lg={4}*/ xl={4}>
			<Card className={statusClass}>
				<Card.Body>
					<CardContent images={props.images} page={page} />
				</Card.Body>
				<Card.Footer>
					{props.cmsLocation !== "/back-office" ? (
						<small>
							Publication: {formatWatchDate(page.publication, "DD-MM-YYYY")}
						</small>
					) : false }
					{props.cmsLocation === "/back-office" ? (
						<>
							{!dayjs(page.publication).isValid() ? (
								<small>
									<i>Draft</i>
									<br />
								</small>
							) : false }
							{dayjs(page.publication).isValid() &&
							dayjs(page.publication).isBefore(dayjs()) ? (
								<small>
									Publication: {formatWatchDate(page.publication, "DD-MM-YYYY")}
									<br />
								</small>
							) : false }
							{dayjs(page.publication).isValid() && !dayjs(page.publication).isBefore(dayjs()) ? (
								<small>
									Programmed for:{" "}
									{formatWatchDate(page.publication, "DD-MM-YYYY")}
									<br />
								</small>
							) : false }
						</>
					) : false }
					<Card.Text>
						<small>
							Creation: {formatWatchDate(page.creation, "DD-MM-YYYY")}
						</small>
					</Card.Text>
					<Card.Text>
						<small>
							<b>Author</b>: {page.authorName}
						</small>
					</Card.Text>
					{props.cmsLocation === "/back-office" && (page.authorId === props.userId || props.role === "admin") ? (
						<>
							<Button
								className="m-1"
								variant="danger"
								onClick={() => props.deletePage(page.id)}
							> <i className="bi bi-trash" /> </Button>
							<Button
								variant="secondary"
								className="m-2"
								onClick={() => { navigate(`/edit/${page.id}`); }}
							> <i className="bi bi-pencil-square" /> </Button>
						</>
					) : false }
				</Card.Footer>
			</Card>
		</Col>
	);
}

export { PageCard };
