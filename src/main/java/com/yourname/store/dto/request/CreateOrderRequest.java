package com.yourname.store.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class CreateOrderRequest {

    @Size(max = 150)
    private String customerName;

    @Size(max = 20)
    @jakarta.validation.constraints.Pattern(regexp = "^[0-9]{9,11}$", message = "So dien thoai khong hop le", flags = {})
    private String customerPhone;

    @Size(max = 255)
    private String customerAddress;

    @Size(max = 500)
    private String note;

    @NotEmpty
    @Valid
    private List<OrderItemRequest> items;
}
