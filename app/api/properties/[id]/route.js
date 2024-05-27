import connectDB from '@/config/database';
import Property from '@/models/Property';
import { getSessionUser } from '@/utils/getSessionUser';

// Helper function to set CORS headers
const setCorsHeaders = (response) => {
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
};

export const GET = async (request, { params }) => {
  try {
    await connectDB();

    const property = await Property.findById(params.id);

    if (!property) {
      const response = new Response('Property Not Found', { status: 404 });
      setCorsHeaders(response);
      return response;
    }

    const response = new Response(JSON.stringify(property), { status: 200 });
    setCorsHeaders(response);
    return response;
  } catch (error) {
    console.log(error);
    const response = new Response('Something Went Wrong', { status: 500 });
    setCorsHeaders(response);
    return response;
  }
};

export const DELETE = async (request, { params }) => {
  try {
    const propertyId = params.id;

    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.userId) {
      const response = new Response('User ID is required', { status: 401 });
      setCorsHeaders(response);
      return response;
    }

    const { userId } = sessionUser;

    await connectDB();

    const property = await Property.findById(propertyId);

    if (!property) {
      const response = new Response('Property Not Found', { status: 404 });
      setCorsHeaders(response);
      return response;
    }

    if (property.owner.toString() !== userId) {
      const response = new Response('Unauthorized', { status: 401 });
      setCorsHeaders(response);
      return response;
    }

    await property.deleteOne();

    const response = new Response('Property Deleted', { status: 200 });
    setCorsHeaders(response);
    return response;
  } catch (error) {
    console.log(error);
    const response = new Response('Something Went Wrong', { status: 500 });
    setCorsHeaders(response);
    return response;
  }
};

export const PUT = async (request, { params }) => {
  try {
    await connectDB();

    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.userId) {
      const response = new Response('User ID is required', { status: 401 });
      setCorsHeaders(response);
      return response;
    }

    const { id } = params;
    const { userId } = sessionUser;

    const formData = await request.formData();
    const amenities = formData.getAll('amenities');

    const existingProperty = await Property.findById(id);

    if (!existingProperty) {
      const response = new Response('Property does not exist', { status: 404 });
      setCorsHeaders(response);
      return response;
    }

    if (existingProperty.owner.toString() !== userId) {
      const response = new Response('Unauthorized', { status: 401 });
      setCorsHeaders(response);
      return response;
    }

    const propertyData = {
      type: formData.get('type'),
      name: formData.get('name'),
      description: formData.get('description'),
      location: {
        street: formData.get('location.street'),
        city: formData.get('location.city'),
        state: formData.get('location.state'),
        zipcode: formData.get('location.zipcode'),
      },
      beds: formData.get('beds'),
      baths: formData.get('baths'),
      square_feet: formData.get('square_feet'),
      amenities,
      rates: {
        weekly: formData.get('rates.weekly'),
        monthly: formData.get('rates.monthly'),
        nightly: formData.get('rates.nightly.'),
      },
      seller_info: {
        name: formData.get('seller_info.name'),
        email: formData.get('seller_info.email'),
        phone: formData.get('seller_info.phone'),
      },
      owner: userId,
    };

    const updatedProperty = await Property.findByIdAndUpdate(id, propertyData);

    const response = new Response(JSON.stringify(updatedProperty), { status: 200 });
    setCorsHeaders(response);
    return response;
  } catch (error) {
    console.log(error);
    const response = new Response('Failed to add property', { status: 500 });
    setCorsHeaders(response);
    return response;
  }
};
