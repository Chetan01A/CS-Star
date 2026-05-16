import axios from 'axios';

async function testExplore() {
    try {
        const response = await axios.get('http://localhost:8000/post/explore');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error fetching explore:', error.message);
    }
}

testExplore();
