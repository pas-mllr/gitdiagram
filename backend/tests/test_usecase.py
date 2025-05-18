import base64
import unittest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app

class UseCaseEndpointTest(unittest.TestCase):
    def test_usecase_endpoint(self):
        with patch('app.routers.usecase.call_model', return_value='graph TD;A-->B'):
            with patch('app.routers.usecase.render_svg', return_value=b'<svg></svg>'):
                client = TestClient(app)
                resp = client.post('/usecase', json={'description': 'test'})
                self.assertEqual(resp.status_code, 200)
                data = resp.json()
                self.assertEqual(data['mermaid'], 'graph TD;A-->B')
                self.assertEqual(base64.b64decode(data['svg']), b'<svg></svg>')

if __name__ == '__main__':
    unittest.main()
