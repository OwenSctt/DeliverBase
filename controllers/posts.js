const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id });
      const timeToMins = (timeStr) => {
        const [hours,mins] = timeStr.split(':').map(Number)
        return hours * 60 + mins
      }

      let average = 0
      let count = 0
      posts.forEach(post => {
        if (post.time && post.eTime){
          const actual = timeToMins(post.time)
          const estimated = timeToMins(post.eTime)
          average += (actual - estimated)
          count++
        }
      });
      const averageTime = count > 0 ? (average / count).toFixed(2) : null
      res.render("profile.ejs", { posts: posts, user: req.user, averageTime });
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      res.render("post.ejs", { post: post, user: req.user,});
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    try {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      await Post.create({
        rname: req.body.rname,
        address: req.body.address,
        time: req.body.time,
        packages: req.body.packages,
        location: req.body.location,
        type: req.body.type,
        notes: req.body.notes,
        image: result.secure_url,
        cloudinaryId: result.public_id,
        eTime: req.body.eTime,
        user: req.user.id,
        date: req.body.date,
        update: req.body.update
      });
      console.log("Post has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
  likePost: async (req, res) => {
    try {
      await Post.findOneAndUpdate(
        { update: req.body.update },
        {
          $set: 'STATUS : Incomplete',
        }
      );
      console.log("Likes +1");
      res.redirect(`/profile/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById(req.params.id);
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);
      // Delete post from db
      await Post.findByIdAndDelete(req.params.id);
      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },
};
