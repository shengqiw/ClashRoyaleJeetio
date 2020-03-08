import MyBG from '../images/bg.jpg'

export const BG = {
    backgroundImage: `url(${MyBG})`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    height: 'auto',
    width: 'auto',
    paddingBottom: '20px'
}
export const BattleHealer = {
    src: require("../images/lagertha.jpg"),
    title: "Promotions",
    text: "Elder & CoLeader",
    footer: "",
    styles: {
        title: "mb-auto mt-1 text-warning",
        text: "mb-0",
        img: "bg-dark text-white hoverzoom cursorpointer",
        imgsrc: {
            height: '40vh',
        }
    }
}

export const Flarney = {
    src: require("../images/flarney.jpg"),
    title: "Founding Fathers",
    text: "Elder & CoLeader",
    footer: "",
    styles: {
        title: "mb-auto mt-1 text-info text-right",
        text: "mb-0",
        img: "bg-dark text-white hoverzoom cursorpointer",
        imgsrc: {
            height: '40vh',
        }
    }
}

export const Jungle = {
    src: require("../images/jungle.jpg"),
    title: "Grow Stronger Together",
    text: "Check out our rules",
    footer: "Clan Record #740 in NA",
    styles: {
        title: "mb-auto text-center display-4 text-bold",
        text: "mt-auto display-4 hoverfade",
        img: "bg-dark text-white cursorpointer",
        imgsrc: {
            height: '60vh',
        }
    }
}
export const King = {
    src: require("../images/ragnar.jpg"),
    title: "Highlights",
    text: "",
    footer: "",
    styles: {
        title: "mb-auto text-center ",
        text: "mb-0",
        img: "bg-dark text-white hoverzoom cursorpointer",
        imgsrc: {
            height: '40vh',
        }
    }
}
export const Princess = {
    src: require("../images/princess.jpg"),
    title: "Realest Rules",
    styles: {
        title: "mt-auto text-center display-1 text-bold",
        img: "bg-dark text-warning"
    }
}