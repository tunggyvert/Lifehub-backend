const DB = require("../configs/database");
const feedbacklimit = 5;

const getnearby = async (req, res) => {
    try {
        var { lookingat } = req.query;
        if (!lookingat) {
            return res.status(400).json({ success: "At least one search parameter is required" });
        }
        var postname = lookingat;
        var username = lookingat;

        if (postname === undefined) { postname = ""; }
        if (username === undefined) { username = ""; }

        let postfeedback = [DB.query("SELECT * FROM posts WHERE caption LIKE ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ?", [`%${postname}%`, feedbacklimit])];
        let userfeedback = [DB.query("SELECT id, username, followers, is_verified, profile_image, role FROM users WHERE username LIKE ? AND deleted_at IS NULL ORDER BY followers ASC LIMIT ?",
            [`%${username}%`, feedbacklimit])];
        const [postdata, userdata] = await Promise.all([...postfeedback, ...userfeedback]);
        res.json({ success: true, posts: postdata[0], users: userdata[0] });
    } catch (err) {
        console.log(err)
        res.status(404).json({ success: "There's unknown error, Probably missing data." });
    }
}

module.exports = {
    getnearby,
}