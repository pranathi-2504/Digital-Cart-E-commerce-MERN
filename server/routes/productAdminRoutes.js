import express from 'express';
import Product from '../models/Product.js';
import protect, {admin} from '../middleware/authMiddleware.js';
const router=express.Router();

// Route Get /api/admin/products
// Get all products (admin only)
// Access private admin
router.get("/",protect,admin,async(req,res)=>{
    try {
        const products=await Product.find({});
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"Server Error"});
    }
})

// Route Get /api/admin/products/:id
// Get single product by ID (admin only)
// Access private admin
router.get("/:id",protect,admin,async(req,res)=>{
    try {
        const product=await Product.findById(req.params.id);
        if(product){
            res.json(product);
        } else {
            res.status(404).json({message:"Product not found"});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"Server Error"});
    }
})

// Route PUT /api/admin/products/:id
// Update product by ID (admin only)
// Access private admin
router.put("/:id",protect,admin,async(req,res)=>{
    try {
        const product = await Product.findById(req.params.id);
        if(product){
            // Update product fields
            product.name = req.body.name || product.name;
            product.description = req.body.description || product.description;
            product.price = req.body.price || product.price;
            product.countInStock = req.body.countInStock || product.countInStock;
            product.sku = req.body.sku || product.sku;
            product.category = req.body.category || product.category;
            product.brand = req.body.brand || product.brand;
            product.sizes = req.body.sizes || product.sizes;
            product.colors = req.body.colors || product.colors;
            product.collections = req.body.collections || product.collections;
            product.material = req.body.material || product.material;
            product.gender = req.body.gender || product.gender;
            product.images = req.body.images || product.images;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({message:"Product not found"});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"Server Error"});
    }
})


export default router;