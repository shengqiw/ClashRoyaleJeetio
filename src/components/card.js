import React from 'react'
import Card from 'react-bootstrap/Card'
import '../index.css'


export function CardImage(props) {
    console.log(props.oof.styles.title)
    return (
        <Card className={props.oof.styles.img}>
            <Card.Img src={props.oof.src} style={props.oof.styles.imgsrc} alt="Card image" />
            <Card.ImgOverlay className="d-flex flex-column">
                <Card.Title className={props.oof.styles.title}><b>{props.oof.title}</b></Card.Title>
                <Card.Text className={props.oof.styles.text}><small>{props.oof.text}</small></Card.Text>
                <Card.Text>{props.oof.footer}</Card.Text>
            </Card.ImgOverlay>
        </Card>
    )
}

export function CardDefault(props) {
    return (
        <Card className="bg-light">
            <Card.Header as="h3" className="text-center">{props.oof.header}</Card.Header>
            <Card.Body>
                <Card.Title as="h5">
                    <ul className={props.oof.stylesUL}>
                        <li style={props.oof.stylesLI}>{props.oof.title[0]}</li>
                        <li style={props.oof.stylesLI}>{props.oof.title[1]}</li>
                        <li style={props.oof.stylesLI}>{props.oof.title[2]}</li>
                    </ul>
                </Card.Title>
            </Card.Body>
        </Card>
    );
}

export function CardText(props) {
    return (
        <Card className="border-0">
            <Card.Body>
                <Card.Title>{props.oof.title}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">{props.oof.subtitle}</Card.Subtitle>
                <Card.Title className="mt-3">{props.oof.optionalTitle}</Card.Title>
                <Card.Subtitle className="">{props.oof.optionalSubtitle}</Card.Subtitle>
                <Card.Title className="mt-3">{props.oof.optionalTitle2}</Card.Title>
                <Card.Text>{props.oof.text[0]}</Card.Text>
                <Card.Text>{props.oof.text[1]}</Card.Text>
                <Card.Text>{props.oof.text[2]}</Card.Text>
                <Card.Text>{props.oof.text[3]}</Card.Text>

            </Card.Body>
        </Card>

    );
}
