import React from 'react'
export const Youtube = () => {
    return (
        <>

            <!-- Load the Twitch embed script-- >
            <script src="https://embed.twitch.tv/embed/v1.js"></script>

            <!--Create a Twitch.Embed object that will render within the "twitch-embed" root element. -- >
            <script type="text/javascript">
                new Twitch.Embed("twitch-embed", {
                    width: 854,
                    height: 480,
                    channel: "monstercat",
                    parent: ["embed.example.com", "othersite.example.com"]
                });
                </script>

        </>
};


// <div
//     className="video"
//     style={{
//         position: "relative",
//         paddingBottom: "56.25%" /* 16:9 */,
//         paddingTop: 25,
//         height: 0
//     }}
// >
//     <iframe
//         title='Xbow vs Golem'
//         style={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             width: "100%",
//             height: "100%"
//         }}
//         src={`https://www.youtube.com/embed/1jpoDlaejZs`}
//         frameBorder="0"
//         fs="1"
//         allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
//     />
// </div>