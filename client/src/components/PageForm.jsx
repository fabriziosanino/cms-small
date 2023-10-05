import { Button, Form, Card, Image, Alert } from "react-bootstrap";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import API from "../API";

function PageForm(props) {
	const { pageId } = useParams();

	const navigate = useNavigate();

	const objToEdit = pageId && props.pages.find((p) => p.id === parseInt(pageId));

	const [title, setTitle] = useState(objToEdit ? objToEdit.title : "");
	const [publicationDate, setPublicationDate] = useState( objToEdit && objToEdit.publication.isValid() ? objToEdit.publication.format("YYYY-MM-DD") : "");

	const [errorMsg, setErrorMsg] = useState("");

	const [users, setUsers] = useState([]);
	const [images, setImages] = useState([]); 
	const [author, setAuthor] = useState(objToEdit ? objToEdit.authorId : "");

	/* Ogni volta che si modificano i blocchi, lo stato cambia quindi il componente viene reindirizzato */
	const [pageBlocks, setPageBlocks] = useState(
		objToEdit ? objToEdit.blocks
			: [
					{
						id: 0,
						type: "header",
						header: "",
						paragraph: "",
						image: "",
						position: -1,
					},
					{
						id: 1,
						type: "paragraph",
						header: "",
						paragraph: "",
						image: "",
						position: -1,
					},
					{
						id: 2,
						type: "image",
						header: "",
						paragraph: "",
						image: "",
						position: -1,
					},
			  ]
	);

	const role = props.user && props.user.role;

	useEffect(() => {
		API.getImages()
			.then((images) => {
				setImages(images);
			})
			.catch((err) => {
				handleErrors(err);
			});

		if(role === "admin") {
			API.getUsers()
				.then((users) => setUsers(users))
				.catch((err) => {
					handleErrors(err);
				});
		}
	}, []);

	const setSelectedImage = (blockId, imgId) => {
		setPageBlocks((oldBlocks) =>
			oldBlocks.map((b) => {
				if (b.id === blockId) return Object.assign({}, b, { image: imgId });
				else return b;
			})
		);
	};

	const moveBlock = (from, to) => {
		setPageBlocks((oldBlocks) => {
			/* Tutti gli elementi vengono ricreati, poi si sposta quello interessato di una posizione (sopra o sotto) 
				e di conseguenza si sposta l'altro blocco (sotto o sopra) */
			let newList = [...oldBlocks];
			// 0 perchè non si deve rimuovere nulla, bisogna solo creare lo spazio per inserire l'elemento da spostare
			newList.splice(to, 0, newList.splice(from, 1)[0]); //La 2conda splice serve per prendere l'elemento da spostare. [0] perchè la splice restituisce un vettore, serve solo il primo elemento
			return newList;
		});
	};

	/* Controlla che ci sia un header ed almeno un altro dei 2 componenti */
	const checkBlocks = (blocks) => {
		let header = false;
		let other = false;

		blocks.forEach((b) => {
			if (b.type === "header" && b.header !== "") header = true;
			else if ((b.type === "image" && b.image !== "") || (b.type === "paragraph" && b.paragraph !== "")) other = true;
		});

		return header && other;
	};

	const checkBlockContent = (blocks) => {
		let error = false;
		blocks.forEach((b) => { if (b[b.type] === "") error = true;});
		return error;
	};

	const setHeader = (blockId, newValue) => {
		setPageBlocks((oldBlocks) =>
			oldBlocks.map((b) => {
				if (b.id === blockId) return Object.assign({}, b, { header: newValue });
				return b;
			})
		);
	};

	const setParagraph = (blockId, newValue) => {
		setPageBlocks((oldBlocks) =>
			oldBlocks.map((b) => {
				if (b.id === blockId) return Object.assign({}, b, { paragraph: newValue });
				return b;
			})
		);
	};

	const deleteBlock = (blockId) => {
		setPageBlocks((oldBlocks) => oldBlocks.filter((b) => b.id !== blockId));
	};

	const addBlock = (type) => {
		setPageBlocks((oldBlocks) => {
			/* Se non ci sono ancora blocchi nel form, allora l'id deve essere 0 (nel caso in cui l'utente abbia eliminato tutto) */
			const newTempId = oldBlocks.length === 0 ? 0 : Math.max(...oldBlocks.map((b) => b.id)) + 1;

			return [
				...oldBlocks,
				{
					id: newTempId,
					type: type,
					header: "",
					paragraph: "",
					image: "",
					position: -1,
				},
			];
		});
	};

	function handleSubmit(event) {
		event.preventDefault();

		if (title == "") setErrorMsg("Title non valid.");
		else if (checkBlockContent(pageBlocks)) setErrorMsg("Each block must contain a value.");
		else if (!checkBlocks(pageBlocks)) setErrorMsg("Page must contain an Header and Paragraph or Image.");
		else if (role === "admin" && author === "") setErrorMsg("Page must have an author");
		else {
			const newPage = {
				title: title,
				publication: publicationDate !== "" && dayjs(publicationDate).isValid() ? dayjs(publicationDate) : "",
			};

			if (role === "admin") {
				newPage.author = parseInt(author);
			}

			/* Viene aggiunta la posizione al block in base a come erano visualizzati all'utente */
			pageBlocks.forEach((b, position) => {
				b.position = position;
			});

			newPage.blocks = pageBlocks;

			if (objToEdit) {
				newPage.id = objToEdit.id;
				props.updatePage(newPage);
			} else {
				props.addPage(newPage);
			}

			props.setHandled(false);

			navigate("/back-office");
		}
	}

	return (
		<Card className="m-5">
			<Card.Body>
				<Form onSubmit={handleSubmit}>
					<Form.Group className="mb-3">
						<Form.Label>Title</Form.Label>
						<Form.Control
							type="text"
							name="title"
							value={title}
							onChange={(ev) => setTitle(ev.target.value)}
						/>
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label>Publication Date</Form.Label>
						<Form.Control
							type="date"
							name="date"
							value={publicationDate}
							onChange={(ev) => setPublicationDate(ev.target.value)}
						/>
					</Form.Group>

					{role === "admin" ? (
						<>
							<Form.Label>Page Author</Form.Label>
							<Form.Select
								aria-label="Default select"
								value={author}
								onChange={(ev) => setAuthor(ev.target.value)}
							>
								{author === "" ? <option>Select an Author</option> : false}
								{users.map((u) => (
									<option key={u.id} value={u.id}>
										{u.name} {u.role === "admin" ? "(Administrator)" : ""}
									</option>
								))}
							</Form.Select>
						</>
					) : false }

					<br />

					{pageBlocks.map((b, position) => (
						<Form.Group className="mb-3" key={b.id}>
							<Form.Label>
								{b.type.charAt(0).toUpperCase() + b.type.slice(1)}
							</Form.Label>
							<div className="d-flex align-items-center">
								{b.type === "image"
									? images.map((i) => (
											<Image
												style={{ width: "15%", height: "10%" }}
												key={i.id}
												src={i.url}
												className={`imgBlock rounded m-2 clickable-image ${
													b.image === i.id ? "selectedImg" : ""
												}`}
												onClick={() => setSelectedImage(b.id, i.id)} 
											/>
									  ))
									: false}
								{b.type === "header" ? (
									<Form.Control
										key={b.id}
										type="text"
										name="header"
										value={b[b.type]}
										onChange={(ev) => setHeader(b.id, ev.target.value)}
									/>
								) : false }
								{b.type === "paragraph" ? (
									<Form.Control
										key={b.id}
										as="textarea"
										type="text"
										name="paragraph"
										value={b[b.type]}
										onChange={(ev) => setParagraph(b.id, ev.target.value)}
									/>
								) : false }
								{position > 0 ? (
									<Button
										className="mx-2"
										onClick={() => moveBlock(position, position - 1)}
									> Up </Button>
								) : false }
								{position < pageBlocks.length - 1 ? (
									<Button
										className="mx-2"
										onClick={() => moveBlock(position, position + 1)}
									> Down </Button>
								) : false }
								{
									<Button
										className="m-1"
										variant="danger"
										onClick={() => deleteBlock(b.id)}
									> <i className="bi bi-trash" /> </Button>
								}
							</div>
						</Form.Group>
					))}

					<Button
						className="m-2"
						variant="success"
						onClick={() => addBlock("header")}
					> Add Header </Button>
					<Button
						className="m-2"
						variant="success"
						onClick={() => addBlock("paragraph")}
					> Add Paragraph </Button>
					<Button
						className="m-2"
						variant="success"
						onClick={() => addBlock("image")}
					> Add Image </Button>

					<br />
					<br />

					<Button type="submit" variant="primary"> {objToEdit ? "Save" : "Add"} </Button>
					<Button className="mx-2" variant="danger" onClick={() => {
						navigate("/back-office");
					}}> Cancel </Button>
				</Form>
				{errorMsg ? (
					<Alert
						className="m-3"
						variant="danger"
						onClose={() => setErrorMsg("")}
						dismissible
					> {errorMsg} </Alert>
				) : false }
			</Card.Body>
		</Card>
	);
}

export { PageForm };
