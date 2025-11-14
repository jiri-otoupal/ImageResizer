from typing import List, Optional, Literal, Dict

from pydantic import BaseModel, Field


class ResizeRequest(BaseModel):
    file_ids: List[str]
    width: int = Field(gt=0, le=10000)
    height: int = Field(gt=0, le=10000)
    mode: Literal["stretch", "fit", "fill"] = "fit"
    fill_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    fill_colors: Optional[Dict[str, str]] = Field(None,
                                                  description="Per-image fill colors (file_id -> color)")


class ResizeResponse(BaseModel):
    file_ids: List[str]
    total: int
