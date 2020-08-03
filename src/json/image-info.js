import MyBG from '../images/bg.jpg'

export const BG = {
    backgroundImage: `url(${MyBG})`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    paddingBottom: '3rem'
}
export const BattleHealer = {
    src: require("../images/lagertha.jpg"),
    title: "PROMOTIONS",
    footer: "",
    styles: {
        title: "mb-auto mt-1 text-warning",
        text: "mb-0",
        img: "bg-dark text-white hoverzoom cursorpointer",
        imgsrc: {
            height: '40vh',
            objectFit: 'cover',
            objectPosition: 'center'
        }
    }
}

export const Flarney = {
    src: require("../images/flarney.jpg"),
    title: "TOURNAMENTS",
    footer: "",
    styles: {
        title: "mb-auto mt-1 text-info text-right",
        text: "mb-0",
        img: "bg-dark text-white hoverzoom cursorpointer",
        imgsrc: {
            height: '40vh',
            objectFit: 'cover'
        }
    }
}

export const Jungle = {
    src: require("../images/jungle.jpg"),
    title: "Grow Stronger Together",
    text: "Check out our rules",
    footer: "Clan Record #400 in NA",
    styles: {
        title: "mb-auto text-center display-4 text-bold",
        text: "mt-auto display-4 hoverfade",
        img: "bg-dark text-white cursorpointer",
        imgsrc: {
            height: '60vh',
            objectFit: 'cover'
        }
    }
}
export const King = {
    src: require("../images/ragnar.jpg"),
    title: "GUIDES",
    text: "",
    footer: "",
    styles: {
        title: "mb-auto text-center",
        text: "mb-0",
        img: "bg-dark text-white hoverzoom cursorpointer",
        imgsrc: {
            height: '40vh',
            objectFit: 'cover'
        }
    }
}
export const Princess = {
    src: require("../images/princess.jpg"),
    title: "Realest Rules",
    styles: {
        title: "mt-auto text-center display-1 text-bold",
        img: "bg-dark text-warning",
        imgsrc: {
            height: '40vh',
            objectFit: 'cover',
            objectPosition: 'top'
        }
    }
}