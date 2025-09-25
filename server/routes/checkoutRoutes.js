import express from 'express';
import Checkout from '../models/Checkout.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import protect from '../middleware/authMiddleware.js';

const router=express.Router();
// @route post /api/checkout
//Create a new checkout session
// Access proivate

router.post("/",protect,async(req,res)=>{
    const{checkoutItems,shippingAddress,paymentMethod,totalPrice}=req.body;
    if(!checkoutItems||checkoutItems.length===0){
        return res.status(400).json({message:"No items in Checkout"})
    }

    try {
        // Create a new checkout session
        const newCheckout =await Checkout.create({
            user:req.user._id,
            checkoutItems:checkoutItems,
            shippingAddress,
            paymentMethod,
            totalPrice,
            paymentStatus:"Peding",
            isPaid:false,
        });
        res.status(201).json(newCheckout);
    } catch (error) {
        res.status(500).json({message:"Server Error"});
    }
});

// Route PUT /api/checkout/:id/pay
// Update checkout to  mark as paid after successfuly payment
// Private access
router.put("/:id/pay",protect,async(req,res)=>{
    const {paymentStatus,paymentDetails}=req.body;
    try {
        const checkout=await Checkout.findById(req.params.id);
        if(!checkout){
            return res.status(404).json({message:"Checkout not found"});
        }

        if(paymentStatus==='paid'){
            checkout.isPaid=true;
            checkout.paymentStatus=paymentStatus;
            checkout.paymentDetails=paymentDetails;
            checkout.paidAt=Date.now();
            await checkout.save();

            res.status(200).json(checkout);
        }
        else{
            res.status(400).json({message:"Invalid payment status"});
        }
    } catch (error) {
        res.status(500).json({message:"Server Error"});
    }
})

// route post /api/ checkout/:id/finalize
// Finalize checkout and convert to an order after payment confirmation
// Aces private
router.post("/:id/finalize",protect,async (req,res)=>{
    try {
        const checkout=await Checkout.findById(req.params.id);

        if(!checkout){
            return res.status(404).json({message:"Checkout not found"});
        }
        if(checkout.isPaid &&!checkout.isFinalized){
            // Create final order based on the checkout details
            const finalOrder=await Order.create({
                user:checkout.user,
                orderItems:checkout.checkoutItems,
                shippingAddress:{
                    address: checkout.shippingAddress.address || 'N/A',
                    city: checkout.shippingAddress.city || 'N/A',
                    postalCode: checkout.shippingAddress.postalCode || 'N/A',
                    country: checkout.shippingAddress.country || 'N/A'
                },
                paymentMethod:checkout.paymentMethod,
                totalPrice:checkout.totalPrice,
                isPaid:true,
                paidAt:checkout.paidAt,
                isDelivered:false,
                paymentStatus:"paid",
                paymentDetails:checkout.paymentDetails,
            });

            // Mark the checkout as finalized
            checkout.isFinalized=true;
            checkout.finalizedAt=Date.now();
            await checkout.save();

            // Delete the cart associated with the user
            await Cart.findOneAndDelete({user:checkout.user});
            res.status(200).json(finalOrder);
        }
        else if (checkout.isFinalized){
            res.status(400).json({message:"Checkout already finalized"});
        }
        else{
            res.status(400).json({message:"Checkout is not paid"});
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
            res.status(400).json({
                message: "Validation Error", 
                details: Object.values(error.errors).map(e => e.message)
            });
        } else {
            res.status(500).json({message:"Server Error: " + error.message});
        }
    }
})

export default router;

